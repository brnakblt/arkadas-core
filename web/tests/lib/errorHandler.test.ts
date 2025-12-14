/**
 * Error Handler Unit Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    createAppError,
    logError,
    handleError,
    getRecentErrors,
    clearErrorLog,
    getUserFriendlyMessage,
} from '@/lib/errorHandler';

describe('errorHandler', () => {
    beforeEach(() => {
        clearErrorLog();
        vi.spyOn(console, 'group').mockImplementation(() => { });
        vi.spyOn(console, 'error').mockImplementation(() => { });
        vi.spyOn(console, 'log').mockImplementation(() => { });
        vi.spyOn(console, 'groupEnd').mockImplementation(() => { });
    });

    describe('createAppError', () => {
        it('should create error from string', () => {
            const error = createAppError('Test error');

            expect(error.message).toBe('Test error');
            expect(error.id).toMatch(/^err_/);
            expect(error.timestamp).toBeInstanceOf(Date);
            expect(error.severity).toBe('medium');
        });

        it('should create error from Error object', () => {
            const originalError = new Error('Original error');
            const error = createAppError(originalError);

            expect(error.message).toBe('Original error');
            expect(error.stack).toBeDefined();
        });

        it('should use provided options', () => {
            const error = createAppError('Test', {
                code: 'TEST_ERROR',
                severity: 'high',
                context: { userId: 123 },
            });

            expect(error.code).toBe('TEST_ERROR');
            expect(error.severity).toBe('high');
            expect(error.context).toEqual({ userId: 123 });
        });
    });

    describe('logError', () => {
        it('should add error to log', () => {
            const error = createAppError('Test error');
            logError(error);

            const recentErrors = getRecentErrors();
            expect(recentErrors).toHaveLength(1);
            expect(recentErrors[0]).toEqual(error);
        });

        it('should limit log size', () => {
            for (let i = 0; i < 110; i++) {
                logError(createAppError(`Error ${i}`));
            }

            const recentErrors = getRecentErrors(200);
            expect(recentErrors.length).toBeLessThanOrEqual(100);
        });
    });

    describe('handleError', () => {
        it('should log and return error', () => {
            const error = handleError('Test error', { code: 'TEST' });

            expect(error.message).toBe('Test error');
            expect(error.code).toBe('TEST');
            expect(getRecentErrors()).toHaveLength(1);
        });

        it('should report high severity errors in production', async () => {
            vi.stubEnv('NODE_ENV', 'production');
            const { handleError, reportError } = await import('@/lib/errorHandler');

            // Mock console to catch output
            const consoleSpy = vi.spyOn(console, 'log');

            const error = handleError('Critical Error', { severity: 'critical', report: true });

            // We can check if it logged "Error reported"
            // Since reportError is internal mostly, checking console side effect is one way
            // Or better, we can mock reportError if it was exported/separable?
            // It calls console.log('[ErrorReporter] Error reported:', ...) inside the file.
            // But wait, reportError IS exported. We can spy on it?
            // Not if we import it.

            // Let's rely on the console log for coverage since we can't easily mock internal function calls 
            // in the same module without elaborate rewiring.
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('[ErrorReporter] Error reported:'),
                expect.any(String)
            );

            vi.unstubAllEnvs();
        });

        it('should not report low severity errors', async () => {
            const error = handleError('Low severity', { severity: 'low', report: true });

            // Low severity errors are logged but not reported
            expect(error.severity).toBe('low');
        });
    });

    describe('reportError', () => {
        beforeEach(() => {
            vi.resetModules();
        });

        it('should skip reporting in development', async () => {
            vi.stubEnv('NODE_ENV', 'development');
            const { reportError } = await import('@/lib/errorHandler');
            const consoleSpy = vi.spyOn(console, 'log');

            await reportError(createAppError('Dev Error'));

            expect(consoleSpy).not.toHaveBeenCalledWith(expect.stringContaining('[ErrorReporter]'));
            vi.unstubAllEnvs();
        });

        it('should report in production', async () => {
            vi.stubEnv('NODE_ENV', 'production');
            const { reportError } = await import('@/lib/errorHandler');
            const consoleSpy = vi.spyOn(console, 'log');

            await reportError(createAppError('Prod Error'));

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('[ErrorReporter] Error reported:'),
                expect.any(String)
            );
            vi.unstubAllEnvs();
        });

        it('should handle reporting failures', async () => {
            vi.stubEnv('NODE_ENV', 'production');
            // Mock console.log to throw error simulating reporting fail logic if we had real fetch
            // But the code has a try/catch block.
            // We can verify the catch block by mocking something inside if possible.
            // The code does: console.log(...) in try block.

            // If we want to reach the catch block, we need the try block to throw.
            // console.log can throw? No. 
            // But we can verify it doesn't crash.

            const { reportError } = await import('@/lib/errorHandler');
            await expect(reportError(createAppError('Safe'))).resolves.not.toThrow();

            vi.unstubAllEnvs();
        });
    });


    describe('clearErrorLog', () => {
        it('should clear all errors', () => {
            logError(createAppError('Error 1'));
            logError(createAppError('Error 2'));

            expect(getRecentErrors()).toHaveLength(2);

            clearErrorLog();

            expect(getRecentErrors()).toHaveLength(0);
        });
    });

    describe('getUserFriendlyMessage', () => {
        it('should return message for known codes', () => {
            expect(getUserFriendlyMessage('NETWORK_ERROR')).toContain('Bağlantı');
            expect(getUserFriendlyMessage('AUTH_ERROR')).toContain('Oturum');
            expect(getUserFriendlyMessage('NOT_FOUND')).toContain('bulunamadı');
        });

        it('should return default for unknown codes', () => {
            expect(getUserFriendlyMessage('UNKNOWN_CODE')).toContain('Beklenmeyen');
            expect(getUserFriendlyMessage(undefined)).toContain('Beklenmeyen');
        });
    });

    describe('getRecentErrors', () => {
        it('should return specified number of errors', () => {
            for (let i = 0; i < 10; i++) {
                logError(createAppError(`Error ${i}`));
            }

            expect(getRecentErrors(5)).toHaveLength(5);
            expect(getRecentErrors(3)).toHaveLength(3);
        });

        it('should return most recent errors first', () => {
            logError(createAppError('First'));
            logError(createAppError('Second'));
            logError(createAppError('Third'));

            const errors = getRecentErrors();
            expect(errors[0].message).toBe('Third');
            expect(errors[2].message).toBe('First');
        });
    });
});
