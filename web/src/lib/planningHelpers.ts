/**
 * Planlama Yardımcı Servisleri
 * 
 * Plan kopyalama, modül takibi, dengeli dağılım, okul saati kontrolü
 */

import { MEB_RULES, ValidationResult, ValidationError, ValidationWarning } from './mebRules';

// ============================================================
// Types
// ============================================================

export interface ScheduleItem {
    id: number;
    studentId: number;
    teacherId: number;
    date: string;
    startTime: string;
    endTime: string;
    type: 'bireysel' | 'grup';
    moduleId?: number;
    moduleName?: string;
}

export interface StudentModule {
    moduleId: number;
    moduleName: string;
    studentId: number;
    totalHours: number;      // Toplam modül süresi
    completedHours: number;  // Tamamlanan saat
    startDate: string;
    status: 'devam' | 'tamamlandi' | 'beklemede';
}

export interface TeacherWorkload {
    teacherId: number;
    teacherName: string;
    dailyLessons: Record<string, number>;  // date -> lesson count
    weeklyLessons: number;
    weeklyHours: number;
    students: number[];
}

export interface SchoolStudent {
    studentId: number;
    attendsSchool: boolean;
    schoolStartTime?: string;
    schoolEndTime?: string;
}

// ============================================================
// Module Completion Tracking
// ============================================================

/**
 * Modül tamamlanma durumunu kontrol eder
 */
export function checkModuleCompletion(
    module: StudentModule,
    scheduledHours: number = 0
): {
    isComplete: boolean;
    remainingHours: number;
    warning?: string;
    progress: number;
} {
    const totalWithScheduled = module.completedHours + scheduledHours;
    const remainingHours = module.totalHours - totalWithScheduled;
    const progress = Math.min(100, Math.round((totalWithScheduled / module.totalHours) * 100));

    let warning: string | undefined;

    if (remainingHours <= 0) {
        warning = `⚠️ ${module.moduleName} modülü tamamlandı! Yeni modül seçin.`;
    } else if (remainingHours <= 2) {
        warning = `ℹ️ ${module.moduleName} modülü bitmek üzere (${remainingHours} saat kaldı)`;
    }

    return {
        isComplete: remainingHours <= 0,
        remainingHours: Math.max(0, remainingHours),
        warning,
        progress,
    };
}

/**
 * Öğrencinin tüm modüllerini kontrol eder
 */
export function getModuleWarnings(
    modules: StudentModule[],
    upcomingSchedule: ScheduleItem[]
): string[] {
    const warnings: string[] = [];

    modules.forEach((module) => {
        // Planlanmış derslerdeki bu modülün saatlerini hesapla
        const scheduledHours = upcomingSchedule
            .filter((s) => s.moduleId === module.moduleId)
            .reduce((sum, s) => {
                const [sh, sm] = s.startTime.split(':').map(Number);
                const [eh, em] = s.endTime.split(':').map(Number);
                return sum + ((eh * 60 + em) - (sh * 60 + sm)) / 60;
            }, 0);

        const result = checkModuleCompletion(module, scheduledHours);
        if (result.warning) {
            warnings.push(result.warning);
        }
    });

    return warnings;
}

// ============================================================
// Plan Copy Functions
// ============================================================

/**
 * Bir günün planını başka bir güne kopyalar
 */
export function copyDayPlan(
    sourceDate: string,
    targetDate: string,
    schedule: ScheduleItem[]
): ScheduleItem[] {
    const sourceLessons = schedule.filter((s) => s.date === sourceDate);

    return sourceLessons.map((lesson, index) => ({
        ...lesson,
        id: Date.now() + index, // Yeni ID
        date: targetDate,
    }));
}

/**
 * Bir haftanın planını başka bir haftaya kopyalar
 */
export function copyWeekPlan(
    sourceWeekStart: string,
    targetWeekStart: string,
    schedule: ScheduleItem[]
): ScheduleItem[] {
    const sourceStart = new Date(sourceWeekStart);
    const targetStart = new Date(targetWeekStart);
    const dayDiff = Math.floor((targetStart.getTime() - sourceStart.getTime()) / (1000 * 60 * 60 * 24));

    // Kaynak haftadaki tüm dersleri al (7 gün)
    const sourceEnd = new Date(sourceStart);
    sourceEnd.setDate(sourceEnd.getDate() + 6);
    const sourceEndStr = sourceEnd.toISOString().split('T')[0];

    const sourceLessons = schedule.filter((s) => s.date >= sourceWeekStart && s.date <= sourceEndStr);

    return sourceLessons.map((lesson, index) => {
        const lessonDate = new Date(lesson.date);
        lessonDate.setDate(lessonDate.getDate() + dayDiff);
        return {
            ...lesson,
            id: Date.now() + index,
            date: lessonDate.toISOString().split('T')[0],
        };
    });
}

/**
 * Bir öğretmenin planını kopyalar
 */
export function copyTeacherPlan(
    sourceTeacherId: number,
    targetTeacherId: number,
    dateRange: { start: string; end: string },
    schedule: ScheduleItem[]
): ScheduleItem[] {
    const sourceLessons = schedule.filter(
        (s) => s.teacherId === sourceTeacherId && s.date >= dateRange.start && s.date <= dateRange.end
    );

    return sourceLessons.map((lesson, index) => ({
        ...lesson,
        id: Date.now() + index,
        teacherId: targetTeacherId,
    }));
}

// ============================================================
// School Hours Validation
// ============================================================

/**
 * Okula giden öğrenciler için okul saati kontrolü
 */
export function validateSchoolHours(
    lesson: ScheduleItem,
    student: SchoolStudent
): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (!student.attendsSchool) {
        return { valid: true, errors, warnings };
    }

    const schoolStart = student.schoolStartTime || MEB_RULES.SCHOOL_HOURS.baslangic;
    const schoolEnd = student.schoolEndTime || MEB_RULES.SCHOOL_HOURS.bitis;

    const toMinutes = (t: string) => {
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
    };

    const lessonStart = toMinutes(lesson.startTime);
    const lessonEnd = toMinutes(lesson.endTime);
    const schoolStartMin = toMinutes(schoolStart);
    const schoolEndMin = toMinutes(schoolEnd);

    // Ders okul saatlerine çakışıyor mu?
    if (lessonStart < schoolEndMin && lessonEnd > schoolStartMin) {
        errors.push({
            code: 'SCHOOL_HOURS_CONFLICT',
            message: `Öğrenci okul saatlerinde (${schoolStart}-${schoolEnd}). Ders bu saatlere planlanamaz.`,
            field: 'startTime',
            rule: 'SCHOOL_HOURS',
        });
    }

    // Okul çıkışından hemen sonra ders riski
    if (lessonStart === schoolEndMin) {
        warnings.push({
            code: 'NO_BREAK_AFTER_SCHOOL',
            message: 'Okul çıkışından hemen sonra ders planlandı',
            suggestion: 'Öğrencinin dinlenmesi için en az 30 dakika ara verin',
        });
    }

    return { valid: errors.length === 0, errors, warnings };
}

// ============================================================
// Teacher Workload Balance
// ============================================================

/**
 * Öğretmenlerin iş yükü dengesini hesaplar
 */
export function calculateTeacherBalance(
    schedule: ScheduleItem[],
    teachers: { id: number; name: string }[]
): {
    workloads: TeacherWorkload[];
    isBalanced: boolean;
    imbalanceWarnings: string[];
} {
    const workloads: TeacherWorkload[] = teachers.map((t) => ({
        teacherId: t.id,
        teacherName: t.name,
        dailyLessons: {},
        weeklyLessons: 0,
        weeklyHours: 0,
        students: [],
    }));

    // Her ders için hesapla
    schedule.forEach((lesson) => {
        const workload = workloads.find((w) => w.teacherId === lesson.teacherId);
        if (!workload) return;

        // Günlük ders sayısı
        workload.dailyLessons[lesson.date] = (workload.dailyLessons[lesson.date] || 0) + 1;
        workload.weeklyLessons++;

        // Saat hesabı
        const [sh, sm] = lesson.startTime.split(':').map(Number);
        const [eh, em] = lesson.endTime.split(':').map(Number);
        workload.weeklyHours += ((eh * 60 + em) - (sh * 60 + sm)) / 60;

        // Öğrenci listesi
        if (!workload.students.includes(lesson.studentId)) {
            workload.students.push(lesson.studentId);
        }
    });

    // Dengesizlik kontrolü
    const avgLessons = workloads.reduce((s, w) => s + w.weeklyLessons, 0) / workloads.length;
    const maxDeviation = MEB_RULES.BALANCED_DISTRIBUTION.max_sapma_yuzdesi / 100;

    const imbalanceWarnings: string[] = [];
    let isBalanced = true;

    workloads.forEach((w) => {
        const deviation = Math.abs(w.weeklyLessons - avgLessons) / avgLessons;
        if (deviation > maxDeviation) {
            isBalanced = false;
            const direction = w.weeklyLessons > avgLessons ? 'fazla' : 'az';
            imbalanceWarnings.push(
                `${w.teacherName}: Haftalık ${w.weeklyLessons} ders (ortalamadan %${Math.round(deviation * 100)} ${direction})`
            );
        }

        // Günlük limit kontrolü
        Object.entries(w.dailyLessons).forEach(([date, count]) => {
            if (count > MEB_RULES.TEACHER_LIMITS.gunluk_ders) {
                imbalanceWarnings.push(
                    `${w.teacherName}: ${date} tarihinde ${count} ders (limit: ${MEB_RULES.TEACHER_LIMITS.gunluk_ders})`
                );
            }
        });
    });

    return { workloads, isBalanced, imbalanceWarnings };
}

/**
 * Otomatik dengeli dağıtım önerisi
 */
export function suggestBalancedDistribution(
    unassignedLessons: Omit<ScheduleItem, 'teacherId'>[],
    currentSchedule: ScheduleItem[],
    teachers: { id: number; name: string; specialties?: string[] }[]
): ScheduleItem[] {
    // Mevcut iş yüklerini hesapla
    const { workloads } = calculateTeacherBalance(currentSchedule, teachers);

    // En az yüklü öğretmeni bul ve ders ata
    return unassignedLessons.map((lesson, index) => {
        // Günlük yükü en az olan öğretmeni seç
        const availableTeachers = workloads
            .filter((w) => {
                const dailyCount = w.dailyLessons[lesson.date] || 0;
                return dailyCount < MEB_RULES.TEACHER_LIMITS.gunluk_ders;
            })
            .sort((a, b) => a.weeklyLessons - b.weeklyLessons);

        const selectedTeacher = availableTeachers[0] || workloads[0];

        // İş yükünü güncelle
        selectedTeacher.dailyLessons[lesson.date] = (selectedTeacher.dailyLessons[lesson.date] || 0) + 1;
        selectedTeacher.weeklyLessons++;

        return {
            ...lesson,
            id: Date.now() + index,
            teacherId: selectedTeacher.teacherId,
        } as ScheduleItem;
    });
}

// ============================================================
// Different Month Week Control
// ============================================================

/**
 * Aynı hafta içinde farklı ay olup olmadığını kontrol eder
 */
export function checkCrossMonthWeek(weekStart: string): {
    crossesMonth: boolean;
    months: string[];
    warning?: string;
} {
    const start = new Date(weekStart);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);

    const startMonth = start.toLocaleString('tr-TR', { month: 'long', year: 'numeric' });
    const endMonth = end.toLocaleString('tr-TR', { month: 'long', year: 'numeric' });

    const crossesMonth = start.getMonth() !== end.getMonth();

    return {
        crossesMonth,
        months: crossesMonth ? [startMonth, endMonth] : [startMonth],
        warning: crossesMonth
            ? `⚠️ Bu hafta iki farklı aya yayılıyor: ${startMonth} ve ${endMonth}. Fatura hesaplamalarına dikkat edin.`
            : undefined,
    };
}

// ============================================================
// Exports
// ============================================================

export default {
    checkModuleCompletion,
    getModuleWarnings,
    copyDayPlan,
    copyWeekPlan,
    copyTeacherPlan,
    validateSchoolHours,
    calculateTeacherBalance,
    suggestBalancedDistribution,
    checkCrossMonthWeek,
};
