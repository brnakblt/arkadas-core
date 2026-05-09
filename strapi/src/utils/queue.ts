import { Queue, Worker, Job, RedisOptions } from 'bullmq';

const REDIS_CONFIG: RedisOptions = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6380'),
    password: process.env.REDIS_PASSWORD,
    maxRetriesPerRequest: null,
};

// 1. Mebbis Sync Queue
export const mebbisQueue = new Queue('mebbis-sync', { connection: REDIS_CONFIG });

// 2. Notification Queue
export const notificationQueue = new Queue('notifications', { connection: REDIS_CONFIG });

/**
 * Initialize Workers
 * In a real Strapi v5 app, this would be in a bootstrap function
 */
export const initWorkers = (strapi: any) => {
    // Mebbis Worker
    new Worker('mebbis-sync', async (job: Job) => {
        const { logId, studentId } = job.data;
        strapi.log.info(`[Worker] Syncing log ${logId} to Mebbis...`);
        
        try {
            const mebbisUrl = process.env.MEBBIS_SERVICE_URL || 'http://localhost:4000';
            const res = await fetch(`${mebbisUrl}/sync`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(job.data)
            });

            if (!res.ok) throw new Error('Mebbis service error');

            const data = await res.json();
            await strapi.db.query('api::attendance-log.attendance-log').update({
                where: { id: logId },
                data: {
                    mebbisSyncStatus: 'synced',
                    mebbisSyncId: data.syncId || `M-${Date.now()}`
                }
            });
        } catch (error) {
            strapi.log.error(`[Worker] Mebbis Sync Failed: ${error.message}`);
            
            // Create sync issue record
            await strapi.entityService.create('api::attendance-sync-issue.attendance-sync-issue', {
                data: {
                    attendance_log: logId,
                    type: 'MEBBIS_ERROR',
                    errorMessage: error.message,
                    resolved: false
                }
            });
            
            throw error; // Let BullMQ handle retry
        }
    }, { connection: REDIS_CONFIG });

    // Notification Worker
    new Worker('notifications', async (job: Job) => {
        const { logId, type } = job.data;
        const notificationService = strapi.service('api::notification-hub.notification-hub');
        
        if (type === 'attendance_checkin') {
            await notificationService.triggerAttendanceNotification(logId);
        }
    }, { connection: REDIS_CONFIG });
};
