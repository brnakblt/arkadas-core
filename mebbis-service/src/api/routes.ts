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

// Create router
const router = Router();

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
    const { donem } = req.query;

    if (!donem || typeof donem !== 'string') {
        const response: ApiResponse = {
            success: false,
            message: 'Dönem parametresi gerekli (YYYY-MM formatında)',
        };
        res.status(400).json(response);
        return;
    }

    logger.info(`Fetching invoice candidates for: ${donem}`);

    const mebbis = createMebbisService();
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

/**
 * POST /api/invoices/create
 * Create invoices for students
 */
router.post('/invoices/create', asyncHandler(async (req: Request, res: Response) => {
    const { invoices, tenantId } = req.body;

    if (!tenantId) {
        const response: ApiResponse = {
            success: false,
            message: 'tenantId gereklidir',
        };
        res.status(400).json(response);
        return;
    }

    if (!Array.isArray(invoices) || invoices.length === 0) {
        const response: ApiResponse = {
            success: false,
            message: 'Fatura listesi gerekli',
        };
        res.status(400).json(response);
        return;
    }

    // Validate
    for (const invoice of invoices) {
        const result = CreateFaturaSchema.safeParse(invoice);
        if (!result.success) {
            const response: ApiResponse = {
                success: false,
                message: 'Doğrulama hatası',
                errors: [result.error.message],
            };
            res.status(400).json(response);
            return;
        }
    }

    logger.info(`Creating ${invoices.length} invoices`);

    await getTenantCredentials(tenantId);

    const job = await invoiceQueue.add('create-batch', {
        invoices,
        tenantId,
        requestedAt: new Date().toISOString(),
    });

    const response: ApiResponse<{ jobId: string; count: number }> = {
        success: true,
        message: `${invoices.length} fatura oluşturulmak üzere kuyruğa eklendi`,
        data: { jobId: job.id || '', count: invoices.length },
    };

    res.status(202).json(response);
}));

/**
 * POST /api/invoices/approve
 * Approve pending invoices for a period
 */
router.post('/invoices/approve', asyncHandler(async (req: Request, res: Response) => {
    const { donem } = req.body;

    if (!donem) {
        const response: ApiResponse = {
            success: false,
            message: 'Dönem parametresi gerekli',
        };
        res.status(400).json(response);
        return;
    }

    logger.info(`Queuing invoice approval for: ${donem}`);

    const job = await invoiceQueue.add('approve-all', {
        donem,
        requestedAt: new Date().toISOString(),
    });

    const response: ApiResponse<{ jobId: string }> = {
        success: true,
        message: 'Fatura onaylama işlemi kuyruğa eklendi',
        data: { jobId: job.id || '' },
    };

    res.status(202).json(response);
}));

// ============================================================================
// BEP Endpoints
// ============================================================================

/**
 * GET /api/bep/students
 * Get students for BEP forms
 */
router.get('/bep/students', asyncHandler(async (req: Request, res: Response) => {
    const { donem, formType } = req.query;

    if (!donem || typeof donem !== 'string') {
        const response: ApiResponse = {
            success: false,
            message: 'Dönem parametresi gerekli',
        };
        res.status(400).json(response);
        return;
    }

    const mebbis = createMebbisService();
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
