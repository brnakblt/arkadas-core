/**
 * Veri Saklama ve Otomatik Silme Servisi
 * 
 * KVKK uyumlu veri saklama süreleri ve otomatik temizleme
 * 150 gün saklama (90 gün zorunlu + 60 gün güvenlik payı)
 */

import { MEB_RULES } from './mebRules';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://127.0.0.1:1337";

// ============================================================
// Veri Saklama Süreleri (Gün)
// ============================================================

export const RETENTION_PERIODS = {
    // BKDS kamera kayıtları (150 gün = 90 zorunlu + 60 güvenlik)
    bkds_kayit: MEB_RULES.BKDS.kayit_saklama_gun,

    // Biyometrik loglar
    biyometrik_log: MEB_RULES.BKDS.kayit_saklama_gun,

    // Oturum logları
    session_log: 365, // 1 yıl

    // Audit logları (KVKK - en az 3 yıl önerilir)
    audit_log: 1095, // 3 yıl

    // Geçici dosyalar
    temp_files: 30,

    // E-fatura arşivi (GİB - 10 yıl zorunlu)
    e_fatura: 3650, // 10 yıl

    // Öğrenci dosyaları (mezuniyetten sonra)
    ogrenci_dosyasi: 1825, // 5 yıl
};

// ============================================================
// Silinecek Veri Türleri
// ============================================================

interface CleanupResult {
    entityType: string;
    deletedCount: number;
    errors: string[];
}

interface CleanupSummary {
    success: boolean;
    timestamp: string;
    results: CleanupResult[];
    totalDeleted: number;
    totalErrors: number;
}

// ============================================================
// Cleanup Functions
// ============================================================

/**
 * Belirli bir entity türü için eski kayıtları temizler
 */
async function cleanupEntity(
    entityType: string,
    apiPath: string,
    retentionDays: number,
    dateField: string,
    token: string,
    tenantId?: number
): Promise<CleanupResult> {
    const errors: string[] = [];
    let deletedCount = 0;

    try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
        const cutoffStr = cutoffDate.toISOString().split('T')[0];

        // Silinecek kayıtları bul
        let url = `${STRAPI_URL}/api/${apiPath}?filters[${dateField}][$lt]=${cutoffStr}&pagination[limit]=100`;
        if (tenantId) {
            url += `&filters[tenant][id][$eq]=${tenantId}`;
        }

        const response = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` },
            cache: 'no-store',
        });

        if (!response.ok) {
            errors.push(`${entityType}: Kayıtlar alınamadı (${response.status})`);
            return { entityType, deletedCount, errors };
        }

        const data = await response.json();
        const records = data.data || [];

        // Her kaydı sil
        for (const record of records) {
            try {
                const deleteResponse = await fetch(
                    `${STRAPI_URL}/api/${apiPath}/${record.documentId || record.id}`,
                    {
                        method: 'DELETE',
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );

                if (deleteResponse.ok) {
                    deletedCount++;
                } else {
                    errors.push(`${entityType} #${record.id}: Silinemedi`);
                }
            } catch (err) {
                errors.push(`${entityType} #${record.id}: ${err}`);
            }
        }
    } catch (error) {
        errors.push(`${entityType}: Genel hata - ${error}`);
    }

    return { entityType, deletedCount, errors };
}

/**
 * Tüm eski verileri temizler (KVKK uyumlu)
 */
export async function runDataCleanup(
    token: string,
    tenantId?: number
): Promise<CleanupSummary> {
    const results: CleanupResult[] = [];

    // 1. BKDS kayıtları (150 gün)
    results.push(
        await cleanupEntity(
            'BKDS Kayıt',
            'bkds-kayitlar',
            RETENTION_PERIODS.bkds_kayit,
            'timestamp',
            token,
            tenantId
        )
    );

    // 2. Oturum logları (365 gün)
    results.push(
        await cleanupEntity(
            'Oturum Log',
            'session-logs',
            RETENTION_PERIODS.session_log,
            'createdAt',
            token,
            tenantId
        )
    );

    // 3. Geçici dosyalar (30 gün)
    results.push(
        await cleanupEntity(
            'Geçici Dosya',
            'temp-files',
            RETENTION_PERIODS.temp_files,
            'createdAt',
            token,
            tenantId
        )
    );

    // Özet
    const totalDeleted = results.reduce((sum, r) => sum + r.deletedCount, 0);
    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);

    return {
        success: totalErrors === 0,
        timestamp: new Date().toISOString(),
        results,
        totalDeleted,
        totalErrors,
    };
}

/**
 * Saklama süresi yaklaşan kayıtları listeler
 */
export async function getExpiringRecords(
    token: string,
    daysUntilExpiry: number = 7,
    tenantId?: number
): Promise<{
    entityType: string;
    count: number;
    oldestDate: string;
}[]> {
    const expiringList: { entityType: string; count: number; oldestDate: string }[] = [];

    const checkEntity = async (
        entityType: string,
        apiPath: string,
        retentionDays: number,
        dateField: string
    ) => {
        const warningDate = new Date();
        warningDate.setDate(warningDate.getDate() - retentionDays + daysUntilExpiry);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

        let url = `${STRAPI_URL}/api/${apiPath}?filters[${dateField}][$lt]=${warningDate.toISOString().split('T')[0]}&filters[${dateField}][$gte]=${cutoffDate.toISOString().split('T')[0]}&pagination[limit]=1`;
        if (tenantId) {
            url += `&filters[tenant][id][$eq]=${tenantId}`;
        }

        try {
            const response = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` },
                cache: 'no-store',
            });

            if (response.ok) {
                const data = await response.json();
                if (data.meta?.pagination?.total > 0) {
                    expiringList.push({
                        entityType,
                        count: data.meta.pagination.total,
                        oldestDate: data.data[0]?.[dateField] || 'Unknown',
                    });
                }
            }
        } catch {
            // Ignore errors for individual checks
        }
    };

    await Promise.all([
        checkEntity('BKDS Kayıt', 'bkds-kayitlar', RETENTION_PERIODS.bkds_kayit, 'timestamp'),
        checkEntity('Oturum Log', 'session-logs', RETENTION_PERIODS.session_log, 'createdAt'),
    ]);

    return expiringList;
}

/**
 * Veri saklama durumu raporu
 */
export async function getRetentionReport(
    token: string,
    tenantId?: number
): Promise<{
    entityType: string;
    retentionDays: number;
    totalCount: number;
    oldestRecord: string | null;
    newestRecord: string | null;
    storageEstimateMB: number;
}[]> {
    // Bu fonksiyon entity istatistiklerini getirir
    // Gerçek implementasyon için Strapi'de özel endpoint gerekir
    return [
        {
            entityType: 'BKDS Kayıt',
            retentionDays: RETENTION_PERIODS.bkds_kayit,
            totalCount: 0,
            oldestRecord: null,
            newestRecord: null,
            storageEstimateMB: 0,
        },
        {
            entityType: 'Audit Log',
            retentionDays: RETENTION_PERIODS.audit_log,
            totalCount: 0,
            oldestRecord: null,
            newestRecord: null,
            storageEstimateMB: 0,
        },
    ];
}

// ============================================================
// Exports
// ============================================================

export default {
    RETENTION_PERIODS,
    runDataCleanup,
    getExpiringRecords,
    getRetentionReport,
};
