/**
 * MEB Kural Doğrulama Servisi
 * 
 * Bu servis, özel eğitim kurumları için MEB mevzuatına uygunluk kontrolü yapar.
 * Ders ekleme, BEP hazırlama ve fatura işlemlerinde kullanılır.
 */

// ============================================================
// MEB Kuralları - Özel Eğitim Yönetmeliği
// ============================================================

export const MEB_RULES = {
    // Haftalık maksimum ders saati (öğrenci başına)
    MAX_WEEKLY_HOURS: {
        bireysel: 8,  // Bireysel eğitim
        grup: 8,      // Grup eğitimi
        toplam: 16,   // Toplam maksimum
    },

    // Günlük maksimum ders
    MAX_DAILY_LESSONS: 4,

    // Ders süresi (dakika)
    LESSON_DURATION: {
        bireysel: 45,
        grup: 45,
        minimum: 30,
        maximum: 60,
    },

    // Grup kapasitesi
    GROUP_CAPACITY: {
        minimum: 2,
        maximum: 8,
        optimal: 4,
    },

    // Öğretmen başına maksimum öğrenci
    TEACHER_STUDENT_RATIO: {
        bireysel: 1,
        grup: 8,
    },

    // Öğretmen çalışma limitleri
    TEACHER_LIMITS: {
        gunluk_ders: 8,      // Günde max ders
        haftalik_ders: 40,   // Haftada max ders
        gunluk_saat: 8,      // Günde max saat
        haftalik_saat: 40,   // Haftada max saat
    },

    // Okul saatleri (okula giden öğrenciler için)
    SCHOOL_HOURS: {
        baslangic: '08:00',
        bitis: '15:00',
        ogle_arasi_baslangic: '12:00',
        ogle_arasi_bitis: '13:00',
    },

    // BEP süreleri
    BEP_DEADLINES: {
        hazirlama_suresi: 30, // gün (kayıttan sonra)
        guncelleme_periyodu: 90, // gün (dönemlik)
        veli_bilgilendirme: 7, // gün (değişiklik sonrası)
    },

    // Modül süreleri (saat cinsinden)
    MODULE_DURATIONS: {
        minimum: 8,    // Modül başına minimum saat
        varsayilan: 16, // Varsayılan modül süresi
    },

    // Fatura kesim kuralları
    INVOICE_RULES: {
        kesim_tarihi: 5, // ayın 5'i
        son_odeme: 15,   // ayın 15'i
        devamsizlik_limiti: 3, // ardışık gün (bu durumda ücret alınmaz)
    },

    // Zorunlu belgeler
    REQUIRED_DOCUMENTS: [
        'ram_raporu',
        'ozel_egitim_raporu',
        'saglik_kurulu_raporu',
        'kimlik_fotokopisi',
        'veli_izin_belgesi',
    ],

    // Dengeli dağılım hedefleri
    BALANCED_DISTRIBUTION: {
        max_sapma_yuzdesi: 20, // Öğretmenler arası max %20 fark
        ideal_gunluk_ders: 6,
    },

    // ============================================================
    // 2024-2025 YENİ MEVZUAT KURALLARI
    // ============================================================

    // Telafi Eğitimi Kuralları
    TELAFI_EGITIMI: {
        max_sure_ay: 24,           // Telafi en geç 24 ay içinde yapılmalı
        aylik_bireysel_limit: 12,  // Ayda max 12 saat bireysel telafi
        gunluk_toplam_limit: 3,    // Günde max 3 saat toplam telafi
    },

    // Gün İçi Plan Değişikliği (YASAK)
    PLAN_DEGISIKLIGI: {
        ayni_gun_yasak: true,      // Gün içinde değişiklik yasak
        minimum_onceden_giris: 1,  // En az 1 gün önceden girilmeli
        ay_basi_giris_zorunlu: true, // Ay başlamadan girilmeli
    },

    // Ücret Artış Formülü (MEB 2024)
    UCRET_ARTISI: {
        formul: '(UFE + TUFE) / 2 * 0.5 * 1.05',
        carpan: 1.05,
        oran: 0.5, // Ortalamanın yarısı
    },

    // BEP Geliştirme Birimi Üyeleri (2024 Güncellemesi)
    BEP_BIRIMI_UYELERI: [
        'ogretmen',
        'uzman_ogretici',
        'psikolog',
        'ergoterapi',  // 2024'te eklendi
        'fizyoterapi',
        'veli',
    ],

    // KVKK Onam Gereksinimleri
    KVKK_ONAM: {
        bkds_zorunlu: true,        // BKDS için onam zorunlu
        foto_video_zorunlu: true,  // Fotoğraf/video için onam zorunlu
        saglik_zorunlu: true,      // Sağlık bilgileri için onam zorunlu
        gecerlilik_suresi_yil: 1,  // Onam geçerlilik süresi (yıl)
    },

    // BKDS (Biyometrik Kimlik Doğrulama) Kuralları - 2025
    BKDS: {
        zorunlu_tarih: '2026-01-01',      // Zorunluluk başlangıç tarihi
        kayit_saklama_gun: 150,           // Kamera kaydı saklama süresi (90 gün zorunlu + 60 gün güvenlik payı)
        yuz_esleme_esik: 0.85,            // Yüz eşleşme minimum skoru
        ram_senkron_zorunlu: true,        // RAM ile senkronizasyon zorunlu
    },
};

// ============================================================
// Validation Types
// ============================================================

export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
}

export interface ValidationError {
    code: string;
    message: string;
    field?: string;
    rule?: string;
}

export interface ValidationWarning {
    code: string;
    message: string;
    suggestion?: string;
}

interface LessonData {
    studentId: number;
    date: string;
    startTime: string;
    endTime: string;
    type: 'bireysel' | 'grup';
    teacherId: number;
    groupSize?: number;
}

interface BepData {
    studentId: number;
    startDate: string;
    goals: { id: string; description: string }[];
    evaluations: { date: string; type: string }[];
}

interface InvoiceData {
    studentId: number;
    month: string;
    totalLessons: number;
    attendedLessons: number;
    absences: { date: string; consecutive?: boolean }[];
}

// ============================================================
// Validation Functions
// ============================================================

/**
 * Ders ekleme kurallarını kontrol eder
 */
export function validateLesson(
    lesson: LessonData,
    existingLessons: LessonData[]
): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // 1. Ders süresi kontrolü
    const duration = calculateDuration(lesson.startTime, lesson.endTime);
    if (duration < MEB_RULES.LESSON_DURATION.minimum) {
        errors.push({
            code: 'LESSON_TOO_SHORT',
            message: `Ders süresi minimum ${MEB_RULES.LESSON_DURATION.minimum} dakika olmalıdır`,
            field: 'duration',
            rule: 'LESSON_DURATION.minimum',
        });
    }
    if (duration > MEB_RULES.LESSON_DURATION.maximum) {
        errors.push({
            code: 'LESSON_TOO_LONG',
            message: `Ders süresi maksimum ${MEB_RULES.LESSON_DURATION.maximum} dakika olmalıdır`,
            field: 'duration',
            rule: 'LESSON_DURATION.maximum',
        });
    }

    // 2. Günlük ders sayısı kontrolü
    const sameDayLessons = existingLessons.filter(
        (l) => l.studentId === lesson.studentId && l.date === lesson.date
    );
    if (sameDayLessons.length >= MEB_RULES.MAX_DAILY_LESSONS) {
        errors.push({
            code: 'DAILY_LIMIT_EXCEEDED',
            message: `Öğrenci günde maksimum ${MEB_RULES.MAX_DAILY_LESSONS} ders alabilir`,
            field: 'date',
            rule: 'MAX_DAILY_LESSONS',
        });
    }

    // 3. Haftalık ders saati kontrolü
    const weekStart = getWeekStart(lesson.date);
    const weekEnd = getWeekEnd(lesson.date);
    const weekLessons = existingLessons.filter(
        (l) =>
            l.studentId === lesson.studentId &&
            l.date >= weekStart &&
            l.date <= weekEnd
    );
    const weeklyHours = weekLessons.reduce(
        (sum, l) => sum + calculateDuration(l.startTime, l.endTime) / 60,
        0
    );
    const lessonHours = duration / 60;

    if (weeklyHours + lessonHours > MEB_RULES.MAX_WEEKLY_HOURS.toplam) {
        errors.push({
            code: 'WEEKLY_LIMIT_EXCEEDED',
            message: `Öğrenci haftalık maksimum ${MEB_RULES.MAX_WEEKLY_HOURS.toplam} saat ders alabilir`,
            field: 'weeklyHours',
            rule: 'MAX_WEEKLY_HOURS.toplam',
        });
    }

    // 4. Grup kapasitesi kontrolü
    if (lesson.type === 'grup' && lesson.groupSize) {
        if (lesson.groupSize < MEB_RULES.GROUP_CAPACITY.minimum) {
            warnings.push({
                code: 'GROUP_TOO_SMALL',
                message: `Grup dersi için minimum ${MEB_RULES.GROUP_CAPACITY.minimum} öğrenci önerilir`,
                suggestion: 'Bireysel ders olarak planlamayı düşünün',
            });
        }
        if (lesson.groupSize > MEB_RULES.GROUP_CAPACITY.maximum) {
            errors.push({
                code: 'GROUP_TOO_LARGE',
                message: `Grup dersi maksimum ${MEB_RULES.GROUP_CAPACITY.maximum} öğrenci içerebilir`,
                field: 'groupSize',
                rule: 'GROUP_CAPACITY.maximum',
            });
        }
    }

    // 5. Zaman çakışması kontrolü
    const timeConflict = existingLessons.find(
        (l) =>
            l.date === lesson.date &&
            (l.studentId === lesson.studentId || l.teacherId === lesson.teacherId) &&
            hasTimeOverlap(lesson.startTime, lesson.endTime, l.startTime, l.endTime)
    );
    if (timeConflict) {
        errors.push({
            code: 'TIME_CONFLICT',
            message: 'Bu saatte başka bir ders mevcut',
            field: 'startTime',
        });
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings,
    };
}

/**
 * BEP hazırlama kurallarını kontrol eder
 */
export function validateBep(bep: BepData, registrationDate: string): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // 1. BEP hazırlama süresi
    const daysSinceRegistration = daysBetween(registrationDate, bep.startDate);
    if (daysSinceRegistration > MEB_RULES.BEP_DEADLINES.hazirlama_suresi) {
        warnings.push({
            code: 'BEP_LATE',
            message: `BEP, kayıttan sonra ${MEB_RULES.BEP_DEADLINES.hazirlama_suresi} gün içinde hazırlanmalıdır`,
            suggestion: `Kayıt tarihi: ${registrationDate}, ${daysSinceRegistration} gün geçti`,
        });
    }

    // 2. Hedef sayısı kontrolü
    if (bep.goals.length === 0) {
        errors.push({
            code: 'NO_GOALS',
            message: 'BEP en az bir hedef içermelidir',
            field: 'goals',
        });
    }
    if (bep.goals.length > 20) {
        warnings.push({
            code: 'TOO_MANY_GOALS',
            message: 'Çok fazla hedef dağınıklığa yol açabilir',
            suggestion: 'Öncelikli 10-15 hedef belirlemeniz önerilir',
        });
    }

    // 3. Değerlendirme periyodu
    if (bep.evaluations.length === 0) {
        warnings.push({
            code: 'NO_EVALUATIONS',
            message: 'Değerlendirme planı eklenmemiş',
            suggestion: 'Dönemlik değerlendirme tarihleri ekleyin',
        });
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings,
    };
}

/**
 * Fatura kurallarını kontrol eder
 */
export function validateInvoice(invoice: InvoiceData): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // 1. Devamsızlık kontrolü
    const consecutiveAbsences = countConsecutiveAbsences(invoice.absences);
    if (consecutiveAbsences >= MEB_RULES.INVOICE_RULES.devamsizlik_limiti) {
        warnings.push({
            code: 'EXCESSIVE_ABSENCE',
            message: `${consecutiveAbsences} ardışık gün devamsızlık`,
            suggestion: 'Bu süre için ücret alınmamalıdır',
        });
    }

    // 2. Ders/katılım oranı
    const attendanceRate = invoice.attendedLessons / invoice.totalLessons;
    if (attendanceRate < 0.5) {
        warnings.push({
            code: 'LOW_ATTENDANCE',
            message: `Katılım oranı düşük: %${Math.round(attendanceRate * 100)}`,
            suggestion: 'Veli ile görüşme yapılmalı',
        });
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings,
    };
}

// ============================================================
// Helper Functions
// ============================================================

function calculateDuration(startTime: string, endTime: string): number {
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    return (endH * 60 + endM) - (startH * 60 + startM);
}

function hasTimeOverlap(
    start1: string, end1: string,
    start2: string, end2: string
): boolean {
    const toMinutes = (t: string) => {
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
    };
    const s1 = toMinutes(start1), e1 = toMinutes(end1);
    const s2 = toMinutes(start2), e2 = toMinutes(end2);
    return s1 < e2 && e1 > s2;
}

function getWeekStart(dateStr: string): string {
    const date = new Date(dateStr);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff)).toISOString().split('T')[0];
}

function getWeekEnd(dateStr: string): string {
    const weekStart = new Date(getWeekStart(dateStr));
    weekStart.setDate(weekStart.getDate() + 6);
    return weekStart.toISOString().split('T')[0];
}

function daysBetween(date1: string, date2: string): number {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}

function countConsecutiveAbsences(absences: { date: string; consecutive?: boolean }[]): number {
    if (absences.length === 0) return 0;

    const sorted = absences.map(a => a.date).sort();
    let maxConsecutive = 1;
    let currentConsecutive = 1;

    for (let i = 1; i < sorted.length; i++) {
        const prevDate = new Date(sorted[i - 1]);
        const currDate = new Date(sorted[i]);
        const diffDays = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);

        if (diffDays === 1) {
            currentConsecutive++;
            maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
        } else {
            currentConsecutive = 1;
        }
    }

    return maxConsecutive;
}

// ============================================================
// Validation API
// ============================================================

/**
 * Genel doğrulama fonksiyonu
 */
export function validate(
    type: 'lesson' | 'bep' | 'invoice',
    data: unknown,
    context?: unknown
): ValidationResult {
    switch (type) {
        case 'lesson':
            return validateLesson(
                data as LessonData,
                (context as { existingLessons: LessonData[] })?.existingLessons || []
            );
        case 'bep':
            return validateBep(
                data as BepData,
                (context as { registrationDate: string })?.registrationDate || ''
            );
        case 'invoice':
            return validateInvoice(data as InvoiceData);
        default:
            return { valid: true, errors: [], warnings: [] };
    }
}

export default { validate, validateLesson, validateBep, validateInvoice, MEB_RULES };
