/**
 * 2024-2025 Mevzuat Uyumluluk Servisleri
 * 
 * - Telafi eğitimi doğrulaması
 * - Gün içi plan değişikliği engeli
 * - Ücret hesaplama formülü
 * - KVKK onam kontrolü
 */

import { MEB_RULES, ValidationResult, ValidationError, ValidationWarning } from './mebRules';

// ============================================================
// Types
// ============================================================

export interface TelafiValidation {
    studentId: number;
    compensationDate: string;
    durationMinutes: number;
    lessonType: 'bireysel' | 'grup';
}

export interface PlanChangeValidation {
    lessonDate: string;
    changeTime: Date;
    changeType: 'create' | 'update' | 'delete';
}

export interface FeeCalculation {
    ufeRate: number;      // Aralık ÜFE oranı (%)
    tufeRate: number;     // Aralık TÜFE oranı (%)
    basePrice: number;    // Mevcut ücret
}

export interface TelafiSummary {
    studentId: number;
    month: string;
    totalBireyselHours: number;
    totalGrupHours: number;
    pendingCount: number;
    expiringSoonCount: number;
}

// ============================================================
// Telafi Eğitimi Doğrulama
// ============================================================

/**
 * Telafi eğitimi kurallarını kontrol eder
 * - 24 ay içinde tamamlanmalı
 * - Ayda max 12 saat bireysel
 * - Günde max 3 saat toplam
 */
export function validateCompensationEducation(
    telafi: TelafiValidation,
    missedDate: string,
    existingCompensationsToday: TelafiValidation[],
    existingCompensationsThisMonth: TelafiValidation[]
): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    const missed = new Date(missedDate);
    const compensation = new Date(telafi.compensationDate);

    // 1. 24 ay süresi kontrolü
    const monthsDiff = (compensation.getFullYear() - missed.getFullYear()) * 12 +
        (compensation.getMonth() - missed.getMonth());

    if (monthsDiff > MEB_RULES.TELAFI_EGITIMI.max_sure_ay) {
        errors.push({
            code: 'TELAFI_SURE_ASIMI',
            message: `Telafi eğitimi en geç ${MEB_RULES.TELAFI_EGITIMI.max_sure_ay} ay içinde yapılmalıdır`,
            field: 'compensationDate',
            rule: 'TELAFI_EGITIMI.max_sure_ay',
        });
    }

    // Deadline uyarısı (son 3 ay kaldıysa)
    if (monthsDiff >= MEB_RULES.TELAFI_EGITIMI.max_sure_ay - 3 && monthsDiff <= MEB_RULES.TELAFI_EGITIMI.max_sure_ay) {
        warnings.push({
            code: 'TELAFI_SURE_YAKLASTI',
            message: `Telafi süresi dolmak üzere (${MEB_RULES.TELAFI_EGITIMI.max_sure_ay - monthsDiff} ay kaldı)`,
            suggestion: 'Telafi eğitimini en kısa sürede planlayın',
        });
    }

    // 2. Günlük limit kontrolü
    const todayHours = existingCompensationsToday.reduce((sum, t) => sum + t.durationMinutes / 60, 0);
    const newTotalToday = todayHours + telafi.durationMinutes / 60;

    if (newTotalToday > MEB_RULES.TELAFI_EGITIMI.gunluk_toplam_limit) {
        errors.push({
            code: 'GUNLUK_TELAFI_LIMIT',
            message: `Günde toplam ${MEB_RULES.TELAFI_EGITIMI.gunluk_toplam_limit} saatten fazla telafi yapılamaz`,
            field: 'durationMinutes',
            rule: 'TELAFI_EGITIMI.gunluk_toplam_limit',
        });
    }

    // 3. Aylık bireysel limit kontrolü
    if (telafi.lessonType === 'bireysel') {
        const monthlyBireyselHours = existingCompensationsThisMonth
            .filter((t) => t.lessonType === 'bireysel')
            .reduce((sum, t) => sum + t.durationMinutes / 60, 0);
        const newTotalMonthly = monthlyBireyselHours + telafi.durationMinutes / 60;

        if (newTotalMonthly > MEB_RULES.TELAFI_EGITIMI.aylik_bireysel_limit) {
            errors.push({
                code: 'AYLIK_BIREYSEL_LIMIT',
                message: `Ayda ${MEB_RULES.TELAFI_EGITIMI.aylik_bireysel_limit} saatten fazla bireysel telafi yapılamaz`,
                field: 'durationMinutes',
                rule: 'TELAFI_EGITIMI.aylik_bireysel_limit',
            });
        }
    }

    return { valid: errors.length === 0, errors, warnings };
}

/**
 * Öğrencinin telafi özeti
 */
export function getCompensationSummary(
    compensations: Array<{
        studentId: number;
        month: string;
        lessonType: 'bireysel' | 'grup';
        durationMinutes: number;
        status: string;
        deadlineDate: string;
    }>
): TelafiSummary[] {
    const summaryMap = new Map<string, TelafiSummary>();
    const today = new Date();

    compensations.forEach((c) => {
        const key = `${c.studentId}-${c.month}`;
        if (!summaryMap.has(key)) {
            summaryMap.set(key, {
                studentId: c.studentId,
                month: c.month,
                totalBireyselHours: 0,
                totalGrupHours: 0,
                pendingCount: 0,
                expiringSoonCount: 0,
            });
        }

        const summary = summaryMap.get(key)!;

        if (c.lessonType === 'bireysel') {
            summary.totalBireyselHours += c.durationMinutes / 60;
        } else {
            summary.totalGrupHours += c.durationMinutes / 60;
        }

        if (c.status === 'beklemede' || c.status === 'planlanmis') {
            summary.pendingCount++;
        }

        const deadline = new Date(c.deadlineDate);
        const daysUntilDeadline = (deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
        if (daysUntilDeadline <= 90 && daysUntilDeadline > 0) {
            summary.expiringSoonCount++;
        }
    });

    return Array.from(summaryMap.values());
}

// ============================================================
// Gün İçi Plan Değişikliği Engeli
// ============================================================

/**
 * Aynı gün plan değişikliği kontrolü
 * MEB mevzuatına göre gün içinde plan değişikliği YASAKTIR
 */
export function validatePlanChange(
    validation: PlanChangeValidation
): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    const lessonDate = new Date(validation.lessonDate);
    lessonDate.setHours(0, 0, 0, 0);

    const changeDate = new Date(validation.changeTime);
    changeDate.setHours(0, 0, 0, 0);

    // Aynı gün kontrolü
    if (lessonDate.getTime() === changeDate.getTime() && MEB_RULES.PLAN_DEGISIKLIGI.ayni_gun_yasak) {
        errors.push({
            code: 'AYNI_GUN_DEGISIKLIK_YASAK',
            message: 'Gün içinde plan değişikliği yapılamaz (MEB Mevzuatı)',
            field: 'lessonDate',
            rule: 'PLAN_DEGISIKLIGI.ayni_gun_yasak',
        });
    }

    // Geçmiş tarih kontrolü
    if (lessonDate < changeDate) {
        errors.push({
            code: 'GECMIS_TARIH_DEGISIKLIK',
            message: 'Geçmiş tarihli dersler değiştirilemez',
            field: 'lessonDate',
        });
    }

    // Ay başı uyarısı
    const lessonMonth = lessonDate.getMonth();
    const changeMonth = changeDate.getMonth();
    if (lessonMonth !== changeMonth && MEB_RULES.PLAN_DEGISIKLIGI.ay_basi_giris_zorunlu) {
        warnings.push({
            code: 'AY_BASI_GIRIS',
            message: 'İş takvimi bir sonraki ay başlamadan girilmelidir',
            suggestion: 'Gelecek ayın planını bu ay sonuna kadar tamamlayın',
        });
    }

    return { valid: errors.length === 0, errors, warnings };
}

// ============================================================
// Ücret Hesaplama (MEB 2024 Formülü)
// ============================================================

/**
 * MEB 2024 ücret artış formülü
 * Yeni Ücret = Eski × (1 + ((ÜFE + TÜFE) / 2) / 100 × 0.5 × 1.05)
 */
export function calculateFeeIncrease(calculation: FeeCalculation): {
    averageInflation: number;
    allowedIncreaseRate: number;
    newPrice: number;
    increaseAmount: number;
    formula: string;
} {
    const { ufeRate, tufeRate, basePrice } = calculation;

    // Ortalama enflasyon
    const averageInflation = (ufeRate + tufeRate) / 2;

    // İzin verilen artış oranı: Ortalamanın yarısı × 1.05
    const allowedIncreaseRate = (averageInflation / 100) * MEB_RULES.UCRET_ARTISI.oran * MEB_RULES.UCRET_ARTISI.carpan;

    // Yeni ücret
    const newPrice = basePrice * (1 + allowedIncreaseRate);

    // Artış tutarı
    const increaseAmount = newPrice - basePrice;

    return {
        averageInflation,
        allowedIncreaseRate: allowedIncreaseRate * 100, // Yüzde olarak
        newPrice: Math.round(newPrice * 100) / 100,
        increaseAmount: Math.round(increaseAmount * 100) / 100,
        formula: MEB_RULES.UCRET_ARTISI.formul,
    };
}

// ============================================================
// KVKK Onam Kontrolü
// ============================================================

export type OnamTuru = 'bkds_biyometrik' | 'genel_kvkk' | 'fotograf_video' | 'saglik_bilgileri' | 'pazarlama_iletisim';

/**
 * KVKK onam durumunu kontrol eder
 */
export function checkKvkkConsent(
    requiredConsents: OnamTuru[],
    existingConsents: Array<{ onamTuru: OnamTuru; onamDurumu: boolean; gecerlilikBitisTarihi?: string }>
): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const today = new Date();

    requiredConsents.forEach((required) => {
        const consent = existingConsents.find((c) => c.onamTuru === required);

        if (!consent || !consent.onamDurumu) {
            errors.push({
                code: 'KVKK_ONAM_EKSIK',
                message: `${formatOnamTuru(required)} onayı alınmamış`,
                field: 'onamTuru',
                rule: 'KVKK_ONAM',
            });
        } else if (consent.gecerlilikBitisTarihi) {
            const expiry = new Date(consent.gecerlilikBitisTarihi);
            if (expiry < today) {
                errors.push({
                    code: 'KVKK_ONAM_SURESI_DOLMUS',
                    message: `${formatOnamTuru(required)} onay süresi dolmuş`,
                    field: 'gecerlilikBitisTarihi',
                });
            } else {
                const daysUntilExpiry = (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
                if (daysUntilExpiry <= 30) {
                    warnings.push({
                        code: 'KVKK_ONAM_YAKINDA_DOLACAK',
                        message: `${formatOnamTuru(required)} onay süresi ${Math.ceil(daysUntilExpiry)} gün içinde dolacak`,
                        suggestion: 'Onam yenileme işlemini başlatın',
                    });
                }
            }
        }
    });

    return { valid: errors.length === 0, errors, warnings };
}

function formatOnamTuru(tur: OnamTuru): string {
    const labels: Record<OnamTuru, string> = {
        bkds_biyometrik: 'BKDS Biyometrik',
        genel_kvkk: 'Genel KVKK',
        fotograf_video: 'Fotoğraf/Video',
        saglik_bilgileri: 'Sağlık Bilgileri',
        pazarlama_iletisim: 'Pazarlama İletişim',
    };
    return labels[tur];
}

// ============================================================
// BKDS Zorunluluk Kontrolü
// ============================================================

/**
 * BKDS zorunluluk tarihini kontrol eder
 */
export function checkBkdsRequirement(): {
    isRequired: boolean;
    daysUntilRequired: number;
    message: string;
} {
    const requiredDate = new Date(MEB_RULES.BKDS.zorunlu_tarih);
    const today = new Date();
    const daysUntilRequired = Math.ceil((requiredDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilRequired <= 0) {
        return {
            isRequired: true,
            daysUntilRequired: 0,
            message: 'BKDS entegrasyonu zorunlu hale gelmiştir.',
        };
    }

    return {
        isRequired: false,
        daysUntilRequired,
        message: `BKDS entegrasyonu ${daysUntilRequired} gün içinde zorunlu olacak (${MEB_RULES.BKDS.zorunlu_tarih})`,
    };
}

// ============================================================
// Exports
// ============================================================

export default {
    validateCompensationEducation,
    getCompensationSummary,
    validatePlanChange,
    calculateFeeIncrease,
    checkKvkkConsent,
    checkBkdsRequirement,
};
