
/* eslint-disable no-console */
import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
// eslint-disable-next-line no-undef
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const connection = new IORedis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    maxRetriesPerRequest: null,
});

console.log(`🚀 Worker started! Queue: notifications`);
console.log(`Redis: ${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`);

const worker = new Worker('notifications', async job => {
    console.log(`[Job ${job.id}] Processing ${job.name}...`);

    // Simulate heavy processing (e.g., sending emails, WhatsApp messages, etc.)
    const { title, _message, userCount } = job.data;

    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate delay

    console.log(`✅ [Job ${job.id}] Sent "${title}" to ${userCount} users.`);

    return { sent: userCount };
}, { connection: connection as any });

worker.on('completed', job => {
    console.log(`[Job ${job.id}] Completed!`);
});

worker.on('failed', (job, err) => {
    console.error(`[Job ${job?.id}] Failed: ${err.message}`);
});
