/**
 * Redis-based Document Locking Service
 * Prevents concurrent editing conflicts in OnlyOffice
 */

import Redis from 'ioredis';

const LOCK_PREFIX = 'doclock:';
const DEFAULT_TTL = 30 * 60; // 30 minutes

let redis: Redis | null = null;

function getRedis(): Redis {
    if (!redis) {
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6380';
        const redisPassword = process.env.REDIS_PASSWORD;

        redis = new Redis(redisUrl, {
            password: redisPassword,
            maxRetriesPerRequest: 3,
            lazyConnect: true,
        });
    }
    return redis;
}

export interface LockInfo {
    userId: number;
    userName: string;
    lockedAt: string;
    expiresAt: string;
}

/**
 * Acquire a lock on a document
 * @returns true if lock acquired, false if already locked by another user
 */
export async function acquireLock(
    documentId: string,
    userId: number,
    userName: string,
    ttlSeconds: number = DEFAULT_TTL
): Promise<{ success: boolean; lockedBy?: LockInfo }> {
    const client = getRedis();
    const lockKey = `${LOCK_PREFIX}${documentId}`;

    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);

    const lockData: LockInfo = {
        userId,
        userName,
        lockedAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
    };

    // Try to acquire lock using SETNX
    const result = await client.set(
        lockKey,
        JSON.stringify(lockData),
        'EX',
        ttlSeconds,
        'NX'
    );

    if (result === 'OK') {
        return { success: true };
    }

    // Lock exists, check if it's ours
    const existingLock = await client.get(lockKey);
    if (existingLock) {
        const existing: LockInfo = JSON.parse(existingLock);
        if (existing.userId === userId) {
            // Refresh our own lock
            await client.set(lockKey, JSON.stringify(lockData), 'EX', ttlSeconds);
            return { success: true };
        }
        return { success: false, lockedBy: existing };
    }

    return { success: false };
}

/**
 * Release a document lock
 * Only the lock owner can release
 */
export async function releaseLock(
    documentId: string,
    userId: number
): Promise<boolean> {
    const client = getRedis();
    const lockKey = `${LOCK_PREFIX}${documentId}`;

    const existingLock = await client.get(lockKey);
    if (!existingLock) {
        return true; // Already unlocked
    }

    const existing: LockInfo = JSON.parse(existingLock);
    if (existing.userId !== userId) {
        console.warn(`User ${userId} attempted to release lock owned by ${existing.userId}`);
        return false;
    }

    await client.del(lockKey);
    return true;
}

/**
 * Force release a lock (admin only)
 */
export async function forceReleaseLock(documentId: string): Promise<void> {
    const client = getRedis();
    const lockKey = `${LOCK_PREFIX}${documentId}`;
    await client.del(lockKey);
}

/**
 * Get current lock status for a document
 */
export async function getLockStatus(documentId: string): Promise<LockInfo | null> {
    const client = getRedis();
    const lockKey = `${LOCK_PREFIX}${documentId}`;

    const lockData = await client.get(lockKey);
    if (!lockData) {
        return null;
    }

    return JSON.parse(lockData);
}

/**
 * Check if a document is locked
 */
export async function isLocked(documentId: string): Promise<boolean> {
    const status = await getLockStatus(documentId);
    return status !== null;
}

/**
 * Extend lock TTL (heartbeat)
 */
export async function extendLock(
    documentId: string,
    userId: number,
    ttlSeconds: number = DEFAULT_TTL
): Promise<boolean> {
    const client = getRedis();
    const lockKey = `${LOCK_PREFIX}${documentId}`;

    const existingLock = await client.get(lockKey);
    if (!existingLock) {
        return false;
    }

    const existing: LockInfo = JSON.parse(existingLock);
    if (existing.userId !== userId) {
        return false;
    }

    await client.expire(lockKey, ttlSeconds);
    return true;
}
