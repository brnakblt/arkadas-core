/**
 * MEB Rapor Oluşturma Servisi
 * 
 * PDF ve Excel formatında rapor üretimi
 */

import { ReportRequest, ReportResult, ReportId } from './mebReports';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://127.0.0.1:1337";

// ============================================================
// Data Fetchers
// ============================================================

interface ScheduleData {
    id: number;
    date: string;
    startTime: string;
    endTime: string;
    lessonType: string;
    student: { id: number; firstName: string; lastName: string };
    teacher: { id: number; firstName: string; lastName: string };
    group?: { id: number; name: string };
}

interface StudentData {
    id: number;
    firstName: string;
    lastName: string;
    tcKimlik: string;
    birthDate: string;
    disabilityType: string;
    parentName: string;
    parentPhone: string;
}

interface TeacherData {
    id: number;
    firstName: string;
    lastName: string;
    branch: string;
    tcKimlik: string;
}

interface InvoiceData {
    id: number;
    student: StudentData;
    month: number;
    year: number;
    amount: number;
    status: string;
    sessions: number;
}

async function fetchScheduleData(
    token: string,
    filters: ReportRequest['filters']
): Promise<ScheduleData[]> {
    const params = new URLSearchParams();
    params.append('populate', 'student,teacher,group');

    if (filters.tenantId) {
        params.append('filters[tenant][id][$eq]', String(filters.tenantId));
    }
    if (filters.month && filters.year) {
        const startDate = `${filters.year}-${String(filters.month).padStart(2, '0')}-01`;
        const endDate = new Date(filters.year, filters.month, 0).toISOString().split('T')[0];
        params.append('filters[date][$gte]', startDate);
        params.append('filters[date][$lte]', endDate);
    }
    if (filters.studentId) {
        params.append('filters[student][id][$eq]', String(filters.studentId));
    }
    if (filters.teacherId) {
        params.append('filters[teacher][id][$eq]', String(filters.teacherId));
    }
    params.append('pagination[limit]', '1000');
    params.append('sort', 'date:asc,startTime:asc');

    const response = await fetch(`${STRAPI_URL}/api/schedules?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
    });

    const data = await response.json();
    return data.data || [];
}

async function fetchStudentData(
    token: string,
    filters: ReportRequest['filters']
): Promise<StudentData[]> {
    const params = new URLSearchParams();

    if (filters.tenantId) {
        params.append('filters[tenant][id][$eq]', String(filters.tenantId));
    }
    if (filters.studentId) {
        params.append('filters[id][$eq]', String(filters.studentId));
    }
    params.append('pagination[limit]', '500');
    params.append('sort', 'lastName:asc,firstName:asc');

    const response = await fetch(`${STRAPI_URL}/api/student-profiles?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
    });

    const data = await response.json();
    return data.data || [];
}

async function fetchTeacherData(
    token: string,
    filters: ReportRequest['filters']
): Promise<TeacherData[]> {
    const params = new URLSearchParams();

    if (filters.tenantId) {
        params.append('filters[tenant][id][$eq]', String(filters.tenantId));
    }
    if (filters.teacherId) {
        params.append('filters[id][$eq]', String(filters.teacherId));
    }
    params.append('pagination[limit]', '100');
    params.append('sort', 'lastName:asc');

    const response = await fetch(`${STRAPI_URL}/api/teacher-profiles?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
    });

    const data = await response.json();
    return data.data || [];
}

async function fetchInvoiceData(
    token: string,
    filters: ReportRequest['filters']
): Promise<InvoiceData[]> {
    const params = new URLSearchParams();
    params.append('populate', 'student');

    if (filters.tenantId) {
        params.append('filters[tenant][id][$eq]', String(filters.tenantId));
    }
    if (filters.month) {
        params.append('filters[month][$eq]', String(filters.month));
    }
    if (filters.year) {
        params.append('filters[year][$eq]', String(filters.year));
    }
    params.append('pagination[limit]', '500');

    const response = await fetch(`${STRAPI_URL}/api/faturas?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
    });

    const data = await response.json();
    return data.data || [];
}

// ============================================================
// Report Generators
// ============================================================

type ReportData = {
    headers: string[];
    rows: (string | number)[][];
    title: string;
    subtitle?: string;
    metadata?: Record<string, string>;
};

async function generatePersonelCetveliData(
    token: string,
    filters: ReportRequest['filters']
): Promise<ReportData> {
    const schedules = await fetchScheduleData(token, filters);
    const teachers = await fetchTeacherData(token, filters);

    const monthName = filters.month ? getMonthName(filters.month) : '';
    const year = filters.year || new Date().getFullYear();

    const rows: (string | number)[][] = [];

    // Group by teacher
    const teacherSchedules = new Map<number, ScheduleData[]>();
    schedules.forEach(s => {
        const teacherId = s.teacher?.id;
        if (teacherId) {
            if (!teacherSchedules.has(teacherId)) {
                teacherSchedules.set(teacherId, []);
            }
            const lessons = teacherSchedules.get(teacherId);
            if (lessons) lessons.push(s);
        }
    });

    teachers.forEach(teacher => {
        const teacherLessons = teacherSchedules.get(teacher.id) || [];
        teacherLessons.forEach(lesson => {
            rows.push([
                `${teacher.firstName} ${teacher.lastName}`,
                teacher.branch || '',
                lesson.date,
                lesson.startTime,
                lesson.endTime,
                `${lesson.student?.firstName || ''} ${lesson.student?.lastName || ''}`,
                lesson.lessonType,
                lesson.group?.name || 'Bireysel',
            ]);
        });
    });

    return {
        headers: ['Eğitimci', 'Branş', 'Tarih', 'Başlangıç', 'Bitiş', 'Öğrenci', 'Ders Tipi', 'Grup'],
        rows,
        title: 'Personel Program Cetveli',
        subtitle: `${monthName} ${year}`,
        metadata: {
            'Toplam Eğitimci': String(teachers.length),
            'Toplam Ders': String(schedules.length),
        },
    };
}

async function generateEk4BepData(
    token: string,
    filters: ReportRequest['filters']
): Promise<ReportData> {
    const schedules = await fetchScheduleData(token, filters);
    const students = await fetchStudentData(token, filters);

    const monthName = filters.month ? getMonthName(filters.month) : '';
    const year = filters.year || new Date().getFullYear();

    const rows: (string | number)[][] = [];

    // Group by student
    const studentSchedules = new Map<number, ScheduleData[]>();
    schedules.forEach(s => {
        const studentId = s.student?.id;
        if (studentId) {
            if (!studentSchedules.has(studentId)) {
                studentSchedules.set(studentId, []);
            }
            const lessons = studentSchedules.get(studentId);
            if (lessons) lessons.push(s);
        }
    });

    students.forEach(student => {
        const studentLessons = studentSchedules.get(student.id) || [];
        const bireyselCount = studentLessons.filter(l => l.lessonType === 'bireysel').length;
        const grupCount = studentLessons.filter(l => l.lessonType === 'grup').length;

        rows.push([
            `${student.firstName} ${student.lastName}`,
            student.tcKimlik || '',
            student.disabilityType || '',
            bireyselCount,
            grupCount,
            bireyselCount + grupCount,
            bireyselCount * 45, // dakika
            grupCount * 45,
            (bireyselCount + grupCount) * 45,
        ]);
    });

    return {
        headers: [
            'Öğrenci Adı', 'TC Kimlik', 'Engel Türü',
            'Bireysel Seans', 'Grup Seans', 'Toplam Seans',
            'Bireysel (dk)', 'Grup (dk)', 'Toplam (dk)'
        ],
        rows,
        title: 'Öğrenci Aylık BEP Çizelgesi (EK-4)',
        subtitle: `${monthName} ${year}`,
        metadata: {
            'Toplam Öğrenci': String(students.length),
            'Toplam Seans': String(schedules.length),
        },
    };
}

async function generateEk5CalismaData(
    token: string,
    filters: ReportRequest['filters']
): Promise<ReportData> {
    const schedules = await fetchScheduleData(token, filters);
    const teachers = await fetchTeacherData(token, filters);

    const monthName = filters.month ? getMonthName(filters.month) : '';
    const year = filters.year || new Date().getFullYear();
    const daysInMonth = filters.month ? new Date(year, filters.month, 0).getDate() : 30;

    const rows: (string | number)[][] = [];

    teachers.forEach(teacher => {
        const teacherLessons = schedules.filter(s => s.teacher?.id === teacher.id);

        // Create day-by-day breakdown
        const dayHours: number[] = [];
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(filters.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayLessons = teacherLessons.filter(l => l.date === dateStr);
            dayHours.push(dayLessons.length * 0.75); // 45 min = 0.75 hour
        }

        const totalHours = dayHours.reduce((a, b) => a + b, 0);

        rows.push([
            `${teacher.firstName} ${teacher.lastName}`,
            teacher.branch || '',
            ...dayHours,
            totalHours,
        ]);
    });

    const dayHeaders = Array.from({ length: daysInMonth }, (_, i) => String(i + 1));

    return {
        headers: ['Eğitimci', 'Branş', ...dayHeaders, 'Toplam'],
        rows,
        title: 'Personel Aylık Çalışma Çizelgesi (EK-5)',
        subtitle: `${monthName} ${year}`,
        metadata: {
            'Toplam Eğitimci': String(teachers.length),
        },
    };
}

async function generateFaturaListesiData(
    token: string,
    filters: ReportRequest['filters']
): Promise<ReportData> {
    const invoices = await fetchInvoiceData(token, filters);

    const monthName = filters.month ? getMonthName(filters.month) : '';
    const year = filters.year || new Date().getFullYear();

    const rows: (string | number)[][] = invoices.map(inv => [
        `${inv.student?.firstName || ''} ${inv.student?.lastName || ''}`,
        inv.student?.tcKimlik || '',
        inv.sessions,
        inv.amount,
        inv.status === 'paid' ? 'Ödendi' : 'Bekliyor',
    ]);

    const totalAmount = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
    const paidCount = invoices.filter(inv => inv.status === 'paid').length;

    return {
        headers: ['Öğrenci Adı', 'TC Kimlik', 'Seans Sayısı', 'Tutar (₺)', 'Durum'],
        rows,
        title: 'Öğrenci Aylık Fatura Listesi',
        subtitle: `${monthName} ${year}`,
        metadata: {
            'Toplam Fatura': String(invoices.length),
            'Ödenen': String(paidCount),
            'Toplam Tutar': `${totalAmount.toLocaleString('tr-TR')} ₺`,
        },
    };
}

async function generateEgitimciOgrenciListesiData(
    token: string,
    filters: ReportRequest['filters']
): Promise<ReportData> {
    const schedules = await fetchScheduleData(token, filters);
    const teachers = await fetchTeacherData(token, filters);

    const rows: (string | number)[][] = [];

    // Group students by teacher
    teachers.forEach(teacher => {
        const teacherLessons = schedules.filter(s => s.teacher?.id === teacher.id);
        const studentIds = new Set<number>();
        teacherLessons.forEach(l => {
            if (l.student?.id) studentIds.add(l.student.id);
        });

        const uniqueStudents = Array.from(studentIds).map(id => {
            const lesson = teacherLessons.find(l => l.student?.id === id);
            return lesson?.student;
        }).filter(Boolean);

        uniqueStudents.forEach(student => {
            rows.push([
                `${teacher.firstName} ${teacher.lastName}`,
                teacher.branch || '',
                `${student?.firstName || ''} ${student?.lastName || ''}`,
                teacherLessons.filter(l => l.student?.id === student?.id).length,
            ]);
        });
    });

    return {
        headers: ['Eğitimci', 'Branş', 'Öğrenci', 'Seans Sayısı'],
        rows,
        title: 'Eğitimci - Öğrenci Listesi',
        metadata: {
            'Toplam Eğitimci': String(teachers.length),
        },
    };
}

// ============================================================
// Main Generator
// ============================================================

export async function generateReport(
    request: ReportRequest,
    token: string
): Promise<ReportResult> {
    try {
        let reportData: ReportData;

        // Get data based on report type
        switch (request.reportId) {
            case 'personel_cetveli':
            case 'personel_cetveli_grup':
            case 'personel_cetveli_haftalik':
            case 'personel_cetveli_ogrenci_detay':
            case 'personel_cetveli_gun':
            case 'personel_cetveli_modullu':
            case 'personel_cetveli_seans':
            case 'personel_cetveli_derslik':
                reportData = await generatePersonelCetveliData(token, request.filters);
                break;

            case 'ek4_bep_cizelgesi':
            case 'ek4_bep_form':
            case 'ek4_bep_detay':
            case 'ek4_bep_modullu':
            case 'ek4_bep_mebbis':
            case 'ek4_bep_egitimci_grup':
                reportData = await generateEk4BepData(token, request.filters);
                break;

            case 'ek5_calisma_cizelgesi':
            case 'ek5_calisma_tumu':
            case 'ek5_calisma_haftalik':
            case 'ek5_calisma_tatil':
                reportData = await generateEk5CalismaData(token, request.filters);
                break;

            case 'fatura_listesi':
                reportData = await generateFaturaListesiData(token, request.filters);
                break;

            case 'egitimci_ogrenci_listesi':
            case 'donemlik_egitimci_listesi':
            case 'egitimci_programi':
            case 'planlanmis_egitimci_seans':
                reportData = await generateEgitimciOgrenciListesiData(token, request.filters);
                break;

            default:
                return {
                    success: false,
                    fileName: '',
                    contentType: '',
                    data: null,
                    error: `Desteklenmeyen rapor türü: ${request.reportId}`,
                };
        }

        // Generate output based on format
        if (request.format === 'excel') {
            return generateExcelReport(reportData, request.reportId);
        } else {
            return generatePdfReport(reportData, request.reportId);
        }
    } catch (error) {
        console.error('Report generation error:', error);
        return {
            success: false,
            fileName: '',
            contentType: '',
            data: null,
            error: `Rapor oluşturma hatası: ${error}`,
        };
    }
}

// ============================================================
// Format Generators
// ============================================================

function generateExcelReport(data: ReportData, reportId: ReportId): ReportResult {
    // Generate CSV format (Excel-compatible)
    const csvLines: string[] = [];

    // Title and subtitle
    csvLines.push(data.title);
    if (data.subtitle) csvLines.push(data.subtitle);
    csvLines.push('');

    // Metadata
    if (data.metadata) {
        Object.entries(data.metadata).forEach(([key, value]) => {
            csvLines.push(`${key}: ${value}`);
        });
        csvLines.push('');
    }

    // Headers
    csvLines.push(data.headers.map(h => `"${h}"`).join(','));

    // Rows
    data.rows.forEach(row => {
        csvLines.push(row.map(cell => `"${cell}"`).join(','));
    });

    const csvContent = '\uFEFF' + csvLines.join('\n'); // BOM for Turkish chars
    const buffer = Buffer.from(csvContent, 'utf-8');

    return {
        success: true,
        fileName: `${reportId}_${Date.now()}.csv`,
        contentType: 'text/csv; charset=utf-8',
        data: buffer,
    };
}

function generatePdfReport(data: ReportData, reportId: ReportId): ReportResult {
    // Generate HTML for PDF conversion
    // In production, use puppeteer or similar for actual PDF generation

    const htmlContent = `
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <title>${data.title}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; margin-bottom: 5px; }
        h2 { color: #666; font-weight: normal; margin-top: 0; }
        .metadata { background: #f5f5f5; padding: 10px; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background: #4a90d9; color: white; }
        tr:nth-child(even) { background: #f9f9f9; }
        .footer { margin-top: 20px; font-size: 10px; color: #999; }
    </style>
</head>
<body>
    <h1>${data.title}</h1>
    ${data.subtitle ? `<h2>${data.subtitle}</h2>` : ''}
    
    ${data.metadata ? `
    <div class="metadata">
        ${Object.entries(data.metadata).map(([k, v]) => `<strong>${k}:</strong> ${v}`).join(' | ')}
    </div>
    ` : ''}
    
    <table>
        <thead>
            <tr>
                ${data.headers.map(h => `<th>${h}</th>`).join('')}
            </tr>
        </thead>
        <tbody>
            ${data.rows.map(row => `
                <tr>
                    ${row.map(cell => `<td>${cell}</td>`).join('')}
                </tr>
            `).join('')}
        </tbody>
    </table>
    
    <div class="footer">
        Oluşturulma Tarihi: ${new Date().toLocaleDateString('tr-TR')} | Arkadaş ERP
    </div>
</body>
</html>
    `.trim();

    const buffer = Buffer.from(htmlContent, 'utf-8');

    return {
        success: true,
        fileName: `${reportId}_${Date.now()}.html`,
        contentType: 'text/html; charset=utf-8',
        data: buffer,
    };
}

// ============================================================
// Helpers
// ============================================================

function getMonthName(month: number): string {
    const months = [
        'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
        'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];
    return months[month - 1] || '';
}

export default {
    generateReport,
};
