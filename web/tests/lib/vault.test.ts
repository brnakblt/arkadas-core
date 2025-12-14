/**
 * Vault Utility Unit Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    storeCredential,
    retrieveCredential,
    updateCredential,
    deleteCredential,
    listCredentials,
    storeMebbisCredentials,
    getMebbisCredentials,
    validateMebbisCredentials,
    clearCredentials,
} from '@/lib/vault';

// Mock crypto for testing
vi.mock('crypto', async () => {
    const mockMappers = {
        randomBytes: vi.fn(() => Buffer.alloc(16, 'test')),
        scryptSync: vi.fn(() => Buffer.alloc(32, 'key')),
        randomUUID: vi.fn(() => `uuid-${Math.random().toString(36).substring(7)}`),
        createCipheriv: vi.fn(() => ({
            update: vi.fn().mockReturnValue('encrypted'),
            final: vi.fn().mockReturnValue(''),
            getAuthTag: vi.fn().mockReturnValue(Buffer.alloc(16, 'tag')),
        })),
        createDecipheriv: vi.fn(() => ({
            setAuthTag: vi.fn(),
            update: vi.fn().mockReturnValue('decrypted'),
            final: vi.fn().mockReturnValue(''),
        })),
    };
    return {
        default: mockMappers,
        ...mockMappers,
    };
});

describe('vault', () => {
    beforeEach(async () => {
        vi.spyOn(console, 'log').mockImplementation(() => { });
        vi.spyOn(console, 'warn').mockImplementation(() => { });
        await clearCredentials();
    });

    describe('storeCredential', () => {
        it('should store credential and return id', async () => {
            const id = await storeCredential('test-service', 'user123', 'password123');

            expect(id).toMatch(/^cred_test-service_/);
        });

        it('should store with metadata', async () => {
            const id = await storeCredential('service', 'user', 'pass', { env: 'test' });

            const credentials = await listCredentials();
            const entry = credentials.find((c) => c.id === id);
            expect(entry?.metadata).toEqual({ env: 'test' });
        });
    });

    describe('retrieveCredential', () => {
        it('should retrieve stored credential', async () => {
            await storeCredential('retrieve-test', 'testuser', 'testpass');

            const result = await retrieveCredential('retrieve-test');

            expect(result).not.toBeNull();
            expect(result?.username).toBe('testuser');
            expect(result?.password).toBe('decrypted');
        });

        it('should retrieve by username', async () => {
            await storeCredential('multi-user', 'user1', 'pass1');
            await storeCredential('multi-user', 'user2', 'pass2');

            const result = await retrieveCredential('multi-user', 'user1');

            expect(result?.username).toBe('user1');
            expect(result?.password).toBe('decrypted');
        });

        it('should return null for non-existent credential', async () => {
            const result = await retrieveCredential('non-existent');
            expect(result).toBeNull();
        });
    });

    describe('updateCredential', () => {
        it('should update credential password', async () => {
            const id = await storeCredential('update-test', 'user', 'oldpass');

            const updated = await updateCredential(id, 'newpass');
            expect(updated).toBe(true);

            const result = await retrieveCredential('update-test');
            expect(result?.password).toBe('decrypted');
        });

        it('should return false for non-existent id', async () => {
            const updated = await updateCredential('non-existent-id', 'newpass');
            expect(updated).toBe(false);
        });
    });

    describe('deleteCredential', () => {
        it('should delete credential', async () => {
            const id = await storeCredential('delete-test', 'user', 'pass');

            const deleted = await deleteCredential(id);
            expect(deleted).toBe(true);

            const result = await retrieveCredential('delete-test');
            expect(result).toBeNull();
        });

        it('should return false for non-existent id', async () => {
            const deleted = await deleteCredential('non-existent');
            expect(deleted).toBe(false);
        });
    });

    describe('listCredentials', () => {
        it('should list credentials without passwords', async () => {
            await storeCredential('list-test', 'user', 'secret-password');

            const list = await listCredentials();
            const entry = list.find((c) => c.service === 'list-test');

            expect(entry).toBeDefined();
            expect(entry).not.toHaveProperty('encryptedPassword');
        });
    });

    describe('MEBBIS credentials', () => {
        it('should store MEBBIS credentials', async () => {
            const id = await storeMebbisCredentials('12345678901', 'mebbis-pass');

            expect(id).toMatch(/^cred_mebbis_/);
        });

        it('should retrieve MEBBIS credentials', async () => {
            await storeMebbisCredentials('98765432101', 'secret123');

            const result = await getMebbisCredentials();

            expect(result).not.toBeNull();
            expect(result?.tcNo).toBe('98765432101');
            expect(result?.password).toBe('decrypted');
        });
    });

    describe('validateMebbisCredentials', () => {
        it('should validate correct TC No', () => {
            const result = validateMebbisCredentials('12345678901', 'password123');

            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should reject invalid TC No length', () => {
            const result = validateMebbisCredentials('123456', 'password123');

            expect(result.valid).toBe(false);
            expect(result.errors).toContain('TC Kimlik No 11 haneli olmalıdır');
        });

        it('should reject non-numeric TC No', () => {
            const result = validateMebbisCredentials('1234567890a', 'password123');

            expect(result.valid).toBe(false);
        });

        it('should reject short password', () => {
            const result = validateMebbisCredentials('12345678901', '12345');

            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Şifre en az 6 karakter olmalıdır');
        });

        it('should return multiple errors', () => {
            const result = validateMebbisCredentials('123', 'ab');

            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThanOrEqual(2);
        });
    });
});
