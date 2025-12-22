import { Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const connection = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
});

export const thumbnailWorker = new Worker('thumbnail', async (job: Job) => {
    const { fileId, storagePath, mimeType } = job.data;

    console.log(`Processing thumbnail for file ${fileId} (${mimeType})`);

    if (!mimeType || !mimeType.startsWith('image/')) return;

    try {
        const aiServiceUrl = process.env.AI_SERVICE_URL;
        if (!aiServiceUrl) {
            console.warn('AI_SERVICE_URL not set, skipping thumbnail generation');
            return;
        }

        const response = await fetch(`${aiServiceUrl}/thumbnail`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ storagePath }),
        });

        if (!response.ok) throw new Error(`Thumbnail generation failed: ${response.statusText}`);

        const { thumbnailUrl } = await response.json();

        const strapiUrl = process.env.STRAPI_URL;
        const strapiToken = process.env.STRAPI_API_TOKEN;

        if (strapiUrl && strapiToken) {
            await fetch(`${strapiUrl}/api/storage-files/${fileId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${strapiToken}`,
                },
                body: JSON.stringify({ data: { thumbnailUrl } }),
            });
        }

    } catch (error) {
        console.error(`Thumbnail job ${job.id} failed:`, error);
        throw error;
    }
}, { connection });

export const indexingWorker = new Worker('indexing', async (job: Job) => {
    const { fileId, content } = job.data;
    console.log(`Indexing file ${fileId}`);
    // Implement indexing logic (e.g. ElasticSearch or simple DB text index)
}, { connection });

export const cleanupWorker = new Worker('cleanup', async (job: Job) => {
    console.log(`Cleanup job ${job.id}`);
    // Implement cleanup logic (deleting temp files, expired shares)
}, { connection });
