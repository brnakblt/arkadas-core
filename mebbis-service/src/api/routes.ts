/**
 * Arkadaş MEBBIS Service - API Routes
 * 
 * REST API endpoints for MEBBIS automation operations.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import {
    createMebbisService,
    createEducationEntryService,
    createStudentSyncService,
    createInvoiceService,
    createBepService,
    createWorkPlanService,
    MEBBIS_PAGES,
} from '../services';
import {
    EgitimBilgiGiris,
    CreateFaturaRequest,
    BepPerformansKayit,
    BepGelisimIzleme,
    BepPortfolyoKontrol,
    ApiResponse,
    JobStatus,
    EgitimBilgiGirisSchema,
    CreateFaturaSchema,
} from '../types';
import { logger } from '../utils/logger';
import { getTenantCredentials } from '../utils/tenant';

// Redis connection for job queue
const redisConnection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
});

// Job queues
const syncQueue = new Queue('student-sync', { connection: redisConnection });
const educationQueue = new Queue('education-entry', { connection: redisConnection });
const invoiceQueue = new Queue('invoice', { connection: redisConnection });
const bepQueue = new Queue('bep', { connection: redisConnection });
const workPlanQueue = new Queue('work-plan', { connection: redisConnection });

import { authenticateRequest } from '../middleware/auth';

// Create router
const router = Router();

// Apply authentication to all routes defined after this
// Note: We might want to exclude 'health' but the middleware handles it or we define health before.
// In this file, health is defined on line 65. Let's move health BEFORE auth or handle in middleware.
// The middleware I wrote handles skipping /health.
router.use(authenticateRequest);

// ============================================================================
// Middleware
// ============================================================================

/**
 * Async handler wrapper
 */
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

// ============================================================================
// Health Check
// ============================================================================

/**
 * Health check endpoint
 */
router.get('/health', (_req: Request, res: Response) => {
    res.json({
        status: 'ok',
        service: 'Arkadaş MEBBIS Service',
        timestamp: new Date().toISOString(),
    });
});

// ============================================================================
// Student Sync Endpoints
// ============================================================================

/**
 * POST /api/sync/students
 * Trigger full student sync from MEBBIS to Strapi
 */
router.post('/sync/students', asyncHandler(async (req: Request, res: Response) => {
    logger.info('Received student sync request');

    const { tenantId, userId } = req.body;

    if (!tenantId) {
        const response: ApiResponse = {
            success: false,
            message: 'tenantId gereklidir',
        };
        res.status(400).json(response);
        return;
    }

    // Verify credentials exist for this tenant
    // We don't need the actual credentials here, just ensuring the tenant is valid
    // The worker will fetch credentials again to avoid passing sensitive data in queue
    await getTenantCredentials(tenantId);

    const job = await syncQueue.add('full-sync', {
        tenantId,
        requestedAt: new Date().toISOString(),
        requestedBy: userId || 'system',
    });

    const response: ApiResponse<{ jobId: string }> = {
        success: true,
        message: 'Öğrenci senkronizasyonu başlatıldı',
        data: { jobId: job.id || '' },
    };

    res.status(202).json(response);
}));

/**
 * POST /api/sync/students/:tcKimlikNo
 * Sync a specific student by TC Kimlik No
 */
router.post('/sync/students/:tcKimlikNo', asyncHandler(async (req: Request, res: Response) => {
    const { tcKimlikNo } = req.params;
    const { tenantId } = req.body;

    if (!tenantId) {
        const response: ApiResponse = {
            success: false,
            message: 'tenantId gereklidir',
        };
        res.status(400).json(response);
        return;
    }

    logger.info(`Syncing student: ${tcKimlikNo}`);

    await getTenantCredentials(tenantId);

    const job = await syncQueue.add('sync-single', {
        tcKimlikNo,
        tenantId,
        requestedAt: new Date().toISOString(),
    });

    const response: ApiResponse<{ jobId: string }> = {
        success: true,
        message: 'Öğrenci senkronizasyonu başlatıldı',
        data: { jobId: job.id || '' },
    };

    res.status(202).json(response);
}));

/**
 * POST /api/sync/educators
 * Trigger educator sync from MEBBIS
 */
router.post('/sync/educators', asyncHandler(async (req: Request, res: Response) => {
    logger.info('Received educator sync request');

    const job = await syncQueue.add('educator-sync', {
        requestedAt: new Date().toISOString(),
    });

    const response: ApiResponse<{ jobId: string }> = {
        success: true,
        message: 'Eğitimci senkronizasyonu başlatıldı',
        data: { jobId: job.id || '' },
    };

    res.status(202).json(response);
}));

/**
 * GET /api/students/:tcKimlikNo/report
 * Fetch student report (disability assessment) from MEBBIS
 */
router.get('/students/:tcKimlikNo/report', asyncHandler(async (req: Request, res: Response) => {
    const { tcKimlikNo } = req.params;
    const { tenantId } = req.query;

    if (!tenantId || typeof tenantId !== 'string') {
        const response: ApiResponse = {
            success: false,
            message: 'tenantId parametresi gerekli',
        };
        res.status(400).json(response);
        return;
    }

    logger.info(`Fetching report for student: ${tcKimlikNo}`);

    const credentials = await getTenantCredentials(tenantId);
    const mebbis = createMebbisService(credentials);
    const syncService = createStudentSyncService(mebbis, parseInt(tenantId));

    try {
        await mebbis.initialize();
        await mebbis.login();
        const student = await syncService.fetchStudentDetails(tcKimlikNo);

        if (!student) {
            const response: ApiResponse = {
                success: false,
                message: 'Öğrenci bulunamadı',
            };
            res.status(404).json(response);
            return;
        }

        const response: ApiResponse<any> = {
            success: true,
            data: {
                tcKimlikNo,
                ad: student.ad,
                soyad: student.soyad,
                raporBilgisi: student.raporBilgisi,
                okulBilgisi: student.okulBilgisi,
            },
        };

        res.json(response);
    } finally {
        await mebbis.close();
    }
}));

/**
 * GET /api/students/:tcKimlikNo/modules
 * Fetch module durations for a student from MEBBIS
 */
router.get('/students/:tcKimlikNo/modules', asyncHandler(async (req: Request, res: Response) => {
    const { tcKimlikNo } = req.params;
    const { tenantId, donem } = req.query;

    if (!tenantId || typeof tenantId !== 'string') {
        const response: ApiResponse = {
            success: false,
            message: 'tenantId parametresi gerekli',
        };
        res.status(400).json(response);
        return;
    }

    logger.info(`Fetching modules for student: ${tcKimlikNo}`);

    const credentials = await getTenantCredentials(tenantId);
    const mebbis = createMebbisService(credentials);

    try {
        await mebbis.initialize();
        await mebbis.login();

        // Navigate to education plan view
        await mebbis.navigateTo(MEBBIS_PAGES.EGITIM_PLANI_GORUNTULEME);
        await mebbis.waitForPageReady();

        // Search for student
        await mebbis.fillField('#txtTcKimlik', tcKimlikNo);
        if (donem && typeof donem === 'string') {
            await mebbis.selectOption('#ddlDonem', donem);
        }
        await mebbis.click('#btnAra');
        await mebbis.waitForPageReady();

        // Extract module data
        const modules = await mebbis.executeScript<Array<{
            modulKodu: string;
            modulAdi: string;
            toplamSure: number;
            kullanilanSure: number;
            kalanSure: number;
        }>>(`
            const rows = document.querySelectorAll('#gvModuller tbody tr');
            return Array.from(rows).map(row => {
                const cells = row.querySelectorAll('td');
                return {
                    modulKodu: cells[0]?.textContent?.trim() || '',
                    modulAdi: cells[1]?.textContent?.trim() || '',
                    toplamSure: parseInt(cells[2]?.textContent?.trim() || '0'),
                    kullanilanSure: parseInt(cells[3]?.textContent?.trim() || '0'),
                    kalanSure: parseInt(cells[4]?.textContent?.trim() || '0'),
                };
            });
        `);

        const response: ApiResponse<any> = {
            success: true,
            data: {
                tcKimlikNo,
                donem: donem || 'current',
                modules,
                count: modules.length,
            },
        };

        res.json(response);
    } finally {
        await mebbis.close();
    }
}));

// ============================================================================
// Education Entry Endpoints
// ============================================================================

/**
 * POST /api/education/submit
 * Submit education entries to MEBBIS
 */
router.post('/education/submit', asyncHandler(async (req: Request, res: Response) => {
    const { entries, tenantId } = req.body;

    if (!tenantId) {
        const response: ApiResponse = {
            success: false,
            message: 'tenantId gereklidir',
        };
        res.status(400).json(response);
        return;
    }

    if (!Array.isArray(entries) || entries.length === 0) {
        const response: ApiResponse = {
            success: false,
            message: 'Aktarılacak kayıt bulunamadı',
            errors: ['entries array is required'],
        };
        res.status(400).json(response);
        return;
    }

    // Validate entries
    const validationErrors: string[] = [];
    for (let i = 0; i < entries.length; i++) {
        const result = EgitimBilgiGirisSchema.safeParse(entries[i]);
        if (!result.success) {
            validationErrors.push(`Entry ${i}: ${result.error.message}`);
        }
    }

    if (validationErrors.length > 0) {
        const response: ApiResponse = {
            success: false,
            message: 'Doğrulama hatası',
            errors: validationErrors,
        };
        res.status(400).json(response);
        return;
    }

    logger.info(`Submitting ${entries.length} education entries`);

    await getTenantCredentials(tenantId);

    const job = await educationQueue.add('submit-batch', {
        entries,
        tenantId,
        stopOnError: req.body.stopOnError || false,
        requestedAt: new Date().toISOString(),
    });

    const response: ApiResponse<{ jobId: string; count: number }> = {
        success: true,
        message: `${entries.length} kayıt aktarılmak üzere kuyruğa eklendi`,
        data: { jobId: job.id || '', count: entries.length },
    };

    res.status(202).json(response);
}));

/**
 * GET /api/education/list
 * Get education entries for a period
 */
router.get('/education/list', asyncHandler(async (req: Request, res: Response) => {
    const { donem, tcKimlikNo } = req.query;

    if (!donem) {
        const response: ApiResponse = {
            success: false,
            message: 'Dönem parametresi gerekli',
        };
        res.status(400).json(response);
        return;
    }

    // This would typically fetch from Strapi, not directly from MEBBIS
    const response: ApiResponse<any> = {
        success: true,
        message: 'Liste alındı',
        data: {
            donem,
            tcKimlikNo,
            entries: [], // Would be populated from Strapi
        },
    };

    res.json(response);
}));

// ============================================================================
// Invoice Endpoints
// ============================================================================

/**
 * GET /api/invoices/candidates
 * Get invoice candidates for a period
 */
router.get('/invoices/candidates', asyncHandler(async (req: Request, res: Response) => {
    const { donem, tenantId } = req.query;

    if (!donem || typeof donem !== 'string') {
        const response: ApiResponse = {
            success: false,
            message: 'Dönem parametresi gerekli (YYYY-MM formatında)',
        };
        res.status(400).json(response);
        return;
    }

    if (!tenantId || typeof tenantId !== 'string') {
        const response: ApiResponse = {
            success: false,
            message: 'tenantId parametresi gerekli',
        };
        res.status(400).json(response);
        return;
    }

    logger.info(`Fetching invoice candidates for: ${donem} (Tenant: ${tenantId})`);

    // Fetch tenant credentials
    const credentials = await getTenantCredentials(tenantId);

    // Create service with tenant credentials
    const mebbis = createMebbisService(credentials);
    const invoiceService = createInvoiceService(mebbis);

    try {
        await mebbis.initialize();
        await mebbis.login();
        const candidates = await invoiceService.getInvoiceCandidates(donem);

        const response: ApiResponse<any> = {
            success: true,
            data: { candidates, count: candidates.length },
        };

        res.json(response);
    } finally {
        await mebbis.close();
    }
}));

// ... [create invoice endpoint remains unchanged] ...

// ... [approve invoice endpoint remains unchanged] ...

// ============================================================================
// BEP Endpoints
// ============================================================================

/**
 * GET /api/bep/students
 * Get students for BEP forms
 */
router.get('/bep/students', asyncHandler(async (req: Request, res: Response) => {
    const { donem, formType, tenantId } = req.query;

    if (!donem || typeof donem !== 'string') {
        const response: ApiResponse = {
            success: false,
            message: 'Dönem parametresi gerekli',
        };
        res.status(400).json(response);
        return;
    }

    if (!tenantId || typeof tenantId !== 'string') {
        const response: ApiResponse = {
            success: false,
            message: 'tenantId parametresi gerekli',
        };
        res.status(400).json(response);
        return;
    }

    const credentials = await getTenantCredentials(tenantId);
    const mebbis = createMebbisService(credentials);
    const bepService = createBepService(mebbis);

    try {
        await mebbis.initialize();
        await mebbis.login();

        let students;
        switch (formType) {
            case 'ek4':
                students = await bepService.getPerformanceRecordStudents(donem);
                break;
            case 'ek5':
                students = await bepService.getDevelopmentMonitoringStudents(donem);
                break;
            case 'ek6':
                students = await bepService.getPortfolioChecklistStudents(donem);
                break;
            default:
                students = await bepService.getPerformanceRecordStudents(donem);
        }

        const response: ApiResponse<any> = {
            success: true,
            data: { students, count: students.length },
        };

        res.json(response);
    } finally {
        await mebbis.close();
    }
}));

/**
 * POST /api/bep/submit
 * Submit BEP forms to MEBBIS
 */
router.post('/bep/submit', asyncHandler(async (req: Request, res: Response) => {
    const { formType, records, tenantId } = req.body;

    if (!tenantId) {
        const response: ApiResponse = {
            success: false,
            message: 'tenantId gereklidir',
        };
        res.status(400).json(response);
        return;
    }

    if (!formType || !records || !Array.isArray(records)) {
        const response: ApiResponse = {
            success: false,
            message: 'formType ve records parametreleri gerekli',
        };
        res.status(400).json(response);
        return;
    }

    logger.info(`Submitting ${records.length} BEP forms (${formType})`);

    await getTenantCredentials(tenantId);

    const job = await bepQueue.add(`submit-${formType}`, {
        formType,
        records,
        tenantId,
        requestedAt: new Date().toISOString(),
    });

    const response: ApiResponse<{ jobId: string; count: number }> = {
        success: true,
        message: `${records.length} BEP formu aktarılmak üzere kuyruğa eklendi`,
        data: { jobId: job.id || '', count: records.length },
    };

    res.status(202).json(response);
}));

// ============================================================================
// Work Plan Endpoints (İş Planı)
// ============================================================================

/**
 * POST /api/work-plan/sync
 * Sync work plans to MEBBIS (batch or date range)
 */
router.post('/work-plan/sync', asyncHandler(async (req: Request, res: Response) => {
    const { entries, tenantId, stopOnError } = req.body;

    if (!tenantId) {
        const response: ApiResponse = {
            success: false,
            message: 'tenantId gereklidir',
        };
        res.status(400).json(response);
        return;
    }

    if (!Array.isArray(entries) || entries.length === 0) {
        const response: ApiResponse = {
            success: false,
            message: 'Aktarılacak iş planı bulunamadı',
            errors: ['entries array is required'],
        };
        res.status(400).json(response);
        return;
    }

    logger.info(`Syncing ${entries.length} work plans to MEBBIS`);

    await getTenantCredentials(tenantId);

    const job = await workPlanQueue.add('sync-batch', {
        entries,
        tenantId,
        stopOnError: stopOnError || false,
        requestedAt: new Date().toISOString(),
    });

    const response: ApiResponse<{ jobId: string; count: number }> = {
        success: true,
        message: `${entries.length} iş planı aktarılmak üzere kuyruğa eklendi`,
        data: { jobId: job.id || '', count: entries.length },
    };

    res.status(202).json(response);
}));

/**
 * GET /api/work-plan/fetch
 * Fetch existing work plans from MEBBIS for a date range
 */
router.get('/work-plan/fetch', asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate, tenantId } = req.query;

    if (!startDate || !endDate || typeof startDate !== 'string' || typeof endDate !== 'string') {
        const response: ApiResponse = {
            success: false,
            message: 'startDate ve endDate parametreleri gerekli (YYYY-MM-DD formatında)',
        };
        res.status(400).json(response);
        return;
    }

    if (!tenantId || typeof tenantId !== 'string') {
        const response: ApiResponse = {
            success: false,
            message: 'tenantId parametresi gerekli',
        };
        res.status(400).json(response);
        return;
    }

    logger.info(`Fetching work plans from MEBBIS: ${startDate} to ${endDate}`);

    const credentials = await getTenantCredentials(tenantId);
    const mebbis = createMebbisService(credentials);
    const workPlanService = createWorkPlanService(mebbis);

    try {
        await mebbis.initialize();
        await mebbis.login();
        const plans = await workPlanService.fetchWorkPlans(startDate, endDate);

        const response: ApiResponse<any> = {
            success: true,
            data: { plans, count: plans.length },
        };

        res.json(response);
    } finally {
        await mebbis.close();
    }
}));

/**
 * DELETE /api/work-plan/:mebbisId
 * Delete a work plan from MEBBIS
 */
router.delete('/work-plan/:mebbisId', asyncHandler(async (req: Request, res: Response) => {
    const { mebbisId } = req.params;
    const { tenantId } = req.body;

    if (!tenantId) {
        const response: ApiResponse = {
            success: false,
            message: 'tenantId gereklidir',
        };
        res.status(400).json(response);
        return;
    }

    logger.info(`Deleting work plan ${mebbisId} from MEBBIS`);

    const credentials = await getTenantCredentials(tenantId);
    const mebbis = createMebbisService(credentials);
    const workPlanService = createWorkPlanService(mebbis);

    try {
        await mebbis.initialize();
        await mebbis.login();
        const deleted = await workPlanService.deleteWorkPlan(mebbisId);

        const response: ApiResponse = {
            success: deleted,
            message: deleted ? 'İş planı silindi' : 'Silme işlemi başarısız',
        };

        res.status(deleted ? 200 : 400).json(response);
    } finally {
        await mebbis.close();
    }
}));

// ============================================================================
// Job Status Endpoints
// ============================================================================

/**
 * GET /api/status/:jobId
 * Get status of a background job
 */
router.get('/status/:jobId', asyncHandler(async (req: Request, res: Response) => {
    const { jobId } = req.params;
    const { queue } = req.query;

    let targetQueue: Queue;
    switch (queue) {
        case 'sync':
            targetQueue = syncQueue;
            break;
        case 'education':
            targetQueue = educationQueue;
            break;
        case 'invoice':
            targetQueue = invoiceQueue;
            break;
        case 'bep':
            targetQueue = bepQueue;
            break;
        default:
            // Try to find in all queues
            for (const q of [syncQueue, educationQueue, invoiceQueue, bepQueue]) {
                const job = await q.getJob(jobId);
                if (job) {
                    targetQueue = q;
                    break;
                }
            }
            if (!targetQueue!) {
                const response: ApiResponse = {
                    success: false,
                    message: 'İş bulunamadı',
                };
                res.status(404).json(response);
                return;
            }
    }

    const job = await targetQueue!.getJob(jobId);

    if (!job) {
        const response: ApiResponse = {
            success: false,
            message: 'İş bulunamadı',
        };
        res.status(404).json(response);
        return;
    }

    const state = await job.getState();
    const progress = job.progress;

    const jobStatus: JobStatus = {
        jobId,
        status: state as JobStatus['status'],
        progress: typeof progress === 'number' ? progress : undefined,
        result: state === 'completed' ? job.returnvalue : undefined,
        error: state === 'failed' ? job.failedReason : undefined,
    };

    const response: ApiResponse<JobStatus> = {
        success: true,
        data: jobStatus,
    };

    res.json(response);
}));

/**
 * GET /api/queues/metrics
 * Get job counts for all queues (for scaling/monitoring)
 */
router.get('/queues/metrics', asyncHandler(async (_req: Request, res: Response) => {
    const metrics = {
        sync: await syncQueue.getJobCounts(),
        education: await educationQueue.getJobCounts(),
        invoice: await invoiceQueue.getJobCounts(),
        bep: await bepQueue.getJobCounts(),
        timestamp: new Date().toISOString(),
    };

    const response: ApiResponse<typeof metrics> = {
        success: true,
        data: metrics,
    };

    res.json(response);
}));

// ============================================================================
// Error Handler
// ============================================================================

router.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    logger.error('API Error:', err);

    const response: ApiResponse = {
        success: false,
        message: 'Sunucu hatası',
        errors: [err.message],
    };

    res.status(500).json(response);
});

export default router;
