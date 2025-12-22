
import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { logger } from '../utils/logger';
import { getTenantCredentials } from '../utils/tenant';
import {
    createMebbisService,
    createStudentSyncService,
    createEducationEntryService,
    createInvoiceService,
    createBepService,
} from '../services';

const redisConnection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
});

/**
 * Worker for Student Sync operations
 */
export const studentSyncWorker = new Worker('student-sync', async (job: Job) => {
    const { tenantId, tcKimlikNo, requestedBy } = job.data;
    const jobName = job.name;

    logger.info(`Processing student sync job ${job.id} (${jobName}) for tenant ${tenantId}`);

    try {
        const credentials = await getTenantCredentials(tenantId);
        const mebbis = createMebbisService(credentials);

        // StudentSyncService needs tenantId for Strapi operations
        const syncService = createStudentSyncService(mebbis, tenantId);

        await mebbis.initialize();
        // Check if credentials are valid before trying login
        if (credentials.username && credentials.password) {
            await mebbis.login();
        } else {
            logger.warn(`Missing credentials for tenant ${tenantId}, internal operations only`);
        }

        if (jobName === 'full-sync') {
            await syncService.syncAllStudents();
        } else if (jobName === 'sync-single' && tcKimlikNo) {
            await syncService.syncStudent(tcKimlikNo);
        } else if (jobName === 'educator-sync') {
            logger.warn('Educator sync not yet fully implemented in worker');
        }

        await mebbis.close();
        logger.info(`Job ${job.id} completed successfully`);
        return { success: true };

    } catch (error) {
        logger.error(`Job ${job.id} failed:`, error);
        if (job.attemptsMade < (job.opts.attempts || 1)) {
            // Let BullMQ handle retry
            throw error;
        }
        return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
}, { connection: redisConnection });

/**
 * Worker for Education Entry operations
 */
export const educationWorker = new Worker('education-entry', async (job: Job) => {
    const { tenantId, entries, stopOnError } = job.data;

    logger.info(`Processing education entry job ${job.id} for tenant ${tenantId}`);

    try {
        const credentials = await getTenantCredentials(tenantId);
        const mebbis = createMebbisService(credentials);
        const educationService = createEducationEntryService(mebbis);

        await mebbis.initialize();
        await mebbis.login();

        const results = await educationService.submitBatch(entries, (current, total, entry) => {
            job.updateProgress(Math.round((current / total) * 100));
        }, stopOnError);

        await mebbis.close();

        // Convert Map to object for JSON return
        const resultsObj = Object.fromEntries(results);
        return { success: true, results: resultsObj };

    } catch (error) {
        logger.error(`Education job ${job.id} failed:`, error);
        throw error;
    }
}, { connection: redisConnection });

/**
 * Worker for Invoice operations
 */
export const invoiceWorker = new Worker('invoice', async (job: Job) => {
    const { tenantId, invoices, donem } = job.data;
    const jobName = job.name;

    logger.info(`Processing invoice job ${job.id} (${jobName}) for tenant ${tenantId}`);

    try {
        const credentials = await getTenantCredentials(tenantId);
        const mebbis = createMebbisService(credentials);
        const invoiceService = createInvoiceService(mebbis);

        await mebbis.initialize();
        await mebbis.login();

        let result;

        if (jobName === 'create-batch') {
            // invoices array
            const results = [];
            for (let i = 0; i < invoices.length; i++) {
                const inv = invoices[i];
                const res = await invoiceService.createInvoice(inv);
                results.push(res);
                job.updateProgress(Math.round(((i + 1) / invoices.length) * 100));
            }
            result = { results };

        } else if (jobName === 'approve-all' && donem) {
            result = await invoiceService.approvePendingInvoices(donem);
        }

        await mebbis.close();
        return { success: true, data: result };

    } catch (error) {
        logger.error(`Invoice job ${job.id} failed:`, error);
        throw error;
    }
}, { connection: redisConnection });

/**
 * Worker for BEP operations
 */
export const bepWorker = new Worker('bep', async (job: Job) => {
    const { tenantId, formType, records } = job.data;

    logger.info(`Processing BEP job ${job.id} (${formType}) for tenant ${tenantId}`);

    try {
        const credentials = await getTenantCredentials(tenantId);
        const mebbis = createMebbisService(credentials);
        const bepService = createBepService(mebbis);

        await mebbis.initialize();
        await mebbis.login();

        const results = [];
        const total = records.length;

        for (let i = 0; i < total; i++) {
            const record = records[i];
            let res;

            switch (formType) {
                case 'ek4':
                    res = await bepService.submitPerformanceRecord(record);
                    break;
                case 'ek5':
                    res = await bepService.submitDevelopmentMonitoring(record);
                    break;
                case 'ek6':
                    res = await bepService.submitPortfolioChecklist(record);
                    break;
                default:
                    throw new Error(`Unknown form type: ${formType}`);
            }

            results.push(res);
            job.updateProgress(Math.round(((i + 1) / total) * 100));
        }

        await mebbis.close();
        return { success: true, results };

    } catch (error) {
        logger.error(`BEP job ${job.id} failed:`, error);
        throw error;
    }
}, { connection: redisConnection });
