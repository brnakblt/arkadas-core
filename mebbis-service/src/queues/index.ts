import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
import './workers'; // Import to start workers
import './mebbis';  // Import to start workers
import './domain-workers'; // Import to start tenant-aware workers

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6380';
const connection = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    password: process.env.REDIS_PASSWORD || 'changeme',
});

export const thumbnailQueue = new Queue('thumbnail', { connection });
export const indexingQueue = new Queue('indexing', { connection });
export const cleanupQueue = new Queue('cleanup', { connection });
export const mebbisQueue = new Queue('mebbis-automation', { connection });
