import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
import './workers'; // Import to start workers
import './mebbis';  // Import to start workers

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const connection = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
});

export const thumbnailQueue = new Queue('thumbnail', { connection });
export const indexingQueue = new Queue('indexing', { connection });
export const cleanupQueue = new Queue('cleanup', { connection });
export const mebbisQueue = new Queue('mebbis-automation', { connection });
