// ============================================================
// MEB Kuralları - Özel Eğitim Yönetmeliği (2024-2025)
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

    // KVKK Onam Gereksinimleri
    KVKK_ONAM: {
        bkds_zorunlu: true,
        foto_video_zorunlu: true,
        saglik_zorunlu: true,
        gecerlilik_suresi_yil: 1,
    },

    // BKDS (Biyometrik Kimlik Doğrulama) Kuralları
    BKDS: {
        zorunlu_tarih: '2026-01-01',
        kayit_saklama_gun: 150,
        yuz_esleme_esik: 0.85,
    },
};

/**
 * Mebbis Compliance Service
 * Standard object export for custom API
 */
const mebbisComplianceService = {
    /**
     * Validate a lesson against MEB rules
     */
    validateLesson(lesson: any, existingLessons: any[] = []) {
        const errors: any[] = [];
        const warnings: any[] = [];

        // 1. Duration check
        const duration = this.calculateDuration(lesson.startTime, lesson.endTime);
        if (duration < MEB_RULES.LESSON_DURATION.minimum) {
            errors.push({ code: 'LESSON_TOO_SHORT', message: `Ders süresi minimum ${MEB_RULES.LESSON_DURATION.minimum} dakika olmalıdır` });
        }
        if (duration > MEB_RULES.LESSON_DURATION.maximum) {
            errors.push({ code: 'LESSON_TOO_LONG', message: `Ders süresi maksimum ${MEB_RULES.LESSON_DURATION.maximum} dakika olmalıdır` });
        }

        // 2. Daily count check
        const sameDayLessons = (existingLessons || []).filter(l => l.studentId === lesson.studentId && l.date === lesson.date);
        if (sameDayLessons.length >= MEB_RULES.MAX_DAILY_LESSONS) {
            errors.push({ code: 'DAILY_LIMIT_EXCEEDED', message: `Öğrenci günde maksimum ${MEB_RULES.MAX_DAILY_LESSONS} ders alabilir` });
        }

        return { valid: errors.length === 0, errors, warnings };
    },

    /**
     * Validate compensation education rules
     */
    validateCompensation(telafi: any, missedDate: string) {
        const errors: any[] = [];
        const warnings: any[] = [];

        const missed = new Date(missedDate);
        const compensation = new Date(telafi.compensationDate);

        const monthsDiff = (compensation.getFullYear() - missed.getFullYear()) * 12 +
            (compensation.getMonth() - missed.getMonth());

        if (monthsDiff > MEB_RULES.TELAFI_EGITIMI.max_sure_ay) {
            errors.push({ code: 'TELAFI_SURE_ASIMI', message: `Telafi eğitimi en geç ${MEB_RULES.TELAFI_EGITIMI.max_sure_ay} ay içinde yapılmalıdır` });
        }

        return { valid: errors.length === 0, errors, warnings };
    },

    /**
     * Calculate fee increase based on inflation
     */
    calculateFeeIncrease(ufeRate: number, tufeRate: number, basePrice: number) {
        const averageInflation = (ufeRate + tufeRate) / 2;
        const allowedIncreaseRate = (averageInflation / 100) * MEB_RULES.UCRET_ARTISI.oran * MEB_RULES.UCRET_ARTISI.carpan;
        const newPrice = basePrice * (1 + allowedIncreaseRate);

        return {
            averageInflation,
            allowedIncreaseRate: allowedIncreaseRate * 100,
            newPrice: Math.round(newPrice * 100) / 100,
            increaseAmount: Math.round((newPrice - basePrice) * 100) / 100,
            formula: MEB_RULES.UCRET_ARTISI.formul,
        };
    },

    // Helpers
    calculateDuration(startTime: string, endTime: string) {
        if (!startTime || !endTime) return 0;
        const [startH, startM] = startTime.split(':').map(Number);
        const [endH, endM] = endTime.split(':').map(Number);
        return (endH * 60 + endM) - (startH * 60 + startM);
    }
};

export default mebbisComplianceService;
