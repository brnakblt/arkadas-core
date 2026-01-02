/**
 * Redis-based Document Locking Service
 * Prevents concurrent editing conflicts in OnlyOffice
 * 
 * SECURITY:
 * - Uses Lua script for atomic lock release (prevents race conditions)
 * - Validates ownership before any operation
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

// ============================================================================
// SECURITY FIX: Lua Script for Atomic Lock Release
// This ensures "check ownership" and "delete key" happen atomically
// Prevents race condition where lock expires between check and delete
// ============================================================================

const RELEASE_LOCK_SCRIPT = `
-- Atomic lock release script
-- KEYS[1] = lock key
-- ARGV[1] = expected user ID

local lockData = redis.call('GET', KEYS[1])
if not lockData then
    -- Lock already released
    return 1
end

local lock = cjson.decode(lockData)
local expectedUserId = tonumber(ARGV[1])

if lock.userId ~= expectedUserId then
    -- Lock owned by someone else, don't delete
    return 0
end

-- Ownership verified, delete the lock
redis.call('DEL', KEYS[1])
return 1
`;

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
 * Release a document lock atomically
 * Uses Lua script to prevent race conditions
 * Only the lock owner can release
 */
export async function releaseLock(
    documentId: string,
    userId: number
): Promise<boolean> {
    const client = getRedis();
    const lockKey = `${LOCK_PREFIX}${documentId}`;

    // Execute atomic release script
    const result = await client.eval(
        RELEASE_LOCK_SCRIPT,
        1,           // Number of keys
        lockKey,     // KEYS[1]
        String(userId) // ARGV[1]
    );

    if (result === 0) {
        console.warn(`User ${userId} attempted to release lock owned by another user`);
    }

    return result === 1;
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
 * Extend lock TTL atomically (heartbeat)
 * Uses Lua script to verify ownership before extending
 */
const EXTEND_LOCK_SCRIPT = `
-- Atomic lock extension script
-- KEYS[1] = lock key
-- ARGV[1] = expected user ID
-- ARGV[2] = new TTL in seconds

local lockData = redis.call('GET', KEYS[1])
if not lockData then
    return 0
end

local lock = cjson.decode(lockData)
local expectedUserId = tonumber(ARGV[1])

if lock.userId ~= expectedUserId then
    return 0
end

redis.call('EXPIRE', KEYS[1], tonumber(ARGV[2]))
return 1
`;

export async function extendLock(
    documentId: string,
    userId: number,
    ttlSeconds: number = DEFAULT_TTL
): Promise<boolean> {
    const client = getRedis();
    const lockKey = `${LOCK_PREFIX}${documentId}`;

    const result = await client.eval(
        EXTEND_LOCK_SCRIPT,
        1,                // Number of keys
        lockKey,          // KEYS[1]
        String(userId),   // ARGV[1]
        String(ttlSeconds) // ARGV[2]
    );

    return result === 1;
}
