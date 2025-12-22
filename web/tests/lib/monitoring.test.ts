/**
 * Monitoring Utility Unit Tests
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
    trackMetric,
    getMetrics,
    startSpan,
    addBreadcrumb,
    captureError,
    captureMessage,
    setUser,
    getUser,
} from '@/lib/monitoring';

describe('monitoring', () => {
    beforeEach(() => {
        vi.resetModules();
        vi.spyOn(console, 'warn').mockImplementation(() => { });
        vi.spyOn(console, 'error').mockImplementation(() => { });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('trackMetric', () => {
        it('should track a metric', () => {
            trackMetric({ name: 'test_metric', value: 100, unit: 'ms' });

            const metrics = getMetrics(1);
            expect(metrics).toHaveLength(1);
            expect(metrics[0].name).toBe('test_metric');
            expect(metrics[0].value).toBe(100);
            expect(metrics[0].unit).toBe('ms');
        });

        it('should add timestamp automatically', () => {
            trackMetric({ name: 'timed_metric', value: 50, unit: 'ms' });

            const metrics = getMetrics(1);
            expect(metrics[0].timestamp).toBeInstanceOf(Date);
        });
    });

    describe('startSpan', () => {
        it('should measure operation duration', async () => {
            const endSpan = startSpan('test_operation');

            // Wait a bit
            await new Promise((r) => setTimeout(r, 100));

            endSpan();

            const metrics = getMetrics(10);
            const spanMetric = metrics.find((m) => m.name === 'test_operation');
            expect(spanMetric).toBeDefined();
            if (spanMetric) {
                expect(spanMetric.value).toBeGreaterThan(50); // At least 50ms
                expect(spanMetric.unit).toBe('ms');
            }
        });
    });

    describe('addBreadcrumb', () => {
        it('should log breadcrumb', async () => {
            await addBreadcrumb('User clicked button', 'ui', { buttonId: 'submit' });

            expect(console.warn).toHaveBeenCalledWith(
                '[Monitoring] Breadcrumb: [ui] User clicked button',
                { buttonId: 'submit' }
            );
        });
    });

    describe('captureError', () => {
        it('should log error', async () => {
            await captureError(new Error('Test error'), { userId: '123' });

            expect(console.error).toHaveBeenCalled();
        });

        it('should handle string errors', async () => {
            await captureError('String error message');

            expect(console.error).toHaveBeenCalled();
        });
    });

    describe('captureMessage', () => {
        it('should log info message', async () => {
            await captureMessage('Test message', 'info', { extra: 'data' });

            expect(console.warn).toHaveBeenCalledWith(
                '[Monitoring] INFO: Test message',
                { extra: 'data' }
            );
        });

        it('should log warning message', async () => {
            await captureMessage('Warning message', 'warning');

            expect(console.warn).toHaveBeenCalledWith(
                '[Monitoring] WARNING: Warning message',
                undefined
            );
        });
    });

    describe('setUser / getUser', () => {
        it('should set and get user context', async () => {
            await setUser({ id: 'user-123', email: 'test@example.com', role: 'admin' });

            const user = getUser();
            expect(user).toEqual({
                id: 'user-123',
                email: 'test@example.com',
                role: 'admin',
            });
        });

        it('should clear user context', async () => {
            await setUser({ id: 'user-123' });
            await setUser(null);

            expect(getUser()).toBeNull();
        });
    });

    describe('getMetrics', () => {
        it('should return specified number of metrics', () => {
            for (let i = 0; i < 10; i++) {
                trackMetric({ name: `metric_${i}`, value: i, unit: 'count' });
            }

            expect(getMetrics(5)).toHaveLength(5);
            expect(getMetrics(3)).toHaveLength(3);
        });

        it('should return most recent metrics', () => {
            trackMetric({ name: 'first', value: 1, unit: 'count' });
            trackMetric({ name: 'second', value: 2, unit: 'count' });
            trackMetric({ name: 'third', value: 3, unit: 'count' });

            const metrics = getMetrics(2);
            expect(metrics[1].name).toBe('third');
        });
    });

    describe('Sentry Integration', () => {
        interface SentryMock {
            init: ReturnType<typeof vi.fn>;
            captureException: ReturnType<typeof vi.fn>;
            captureMessage: ReturnType<typeof vi.fn>;
            setUser: ReturnType<typeof vi.fn>;
            addBreadcrumb: ReturnType<typeof vi.fn>;
        }
        let mockSentry: SentryMock;

        beforeEach(() => {
            mockSentry = {
                init: vi.fn(),
                captureException: vi.fn(),
                captureMessage: vi.fn(),
                setUser: vi.fn(),
                addBreadcrumb: vi.fn(),
            };

            vi.doMock('@sentry/nextjs', () => mockSentry);
        });

        it('should initialize Sentry with DSN', async () => {
            const { initMonitoring } = await import('@/lib/monitoring');
            await initMonitoring({ dsn: 'https://example@sentry.io/123' });

            expect(mockSentry.init).toHaveBeenCalledWith(expect.objectContaining({
                dsn: 'https://example@sentry.io/123',
            }));
        });

        it('should not initialize Sentry without DSN', async () => {
            const { initMonitoring } = await import('@/lib/monitoring');
            await initMonitoring({ dsn: '' });

            expect(mockSentry.init).not.toHaveBeenCalled();
        });

        it('should handle Sentry import errors gracefully', async () => {
            // Mock import failure
            vi.doMock('@sentry/nextjs', () => {
                throw new Error('Sentry missing');
            });
            const { initMonitoring } = await import('@/lib/monitoring');

            // Should not throw
            await expect(initMonitoring({ dsn: 'https://test@sentry.io/123' })).resolves.not.toThrow();
        });

        it('should init with proper environment tags', async () => {
            const { initMonitoring } = await import('@/lib/monitoring');

            // Re-mock Sentry to be sure it's clean
            vi.doMock('@sentry/nextjs', () => mockSentry);

            await initMonitoring({
                dsn: 'https://test@sentry.io/123',
                environment: 'production'
            });

            expect(mockSentry.init).toHaveBeenCalledWith(expect.objectContaining({
                environment: 'production',
                tracesSampleRate: 1.0 // Default enabled
            }));
        });


        it('should capture exception in Sentry', async () => {
            const { captureError } = await import('@/lib/monitoring');
            await captureError(new Error('Sentry Test'));

            expect(mockSentry.captureException).toHaveBeenCalledWith(
                expect.any(Error),
                expect.objectContaining({ extra: undefined })
            );
        });

        it('should capture message in Sentry', async () => {
            const { captureMessage } = await import('@/lib/monitoring');
            await captureMessage('Sentry Msg', 'warning');

            expect(mockSentry.captureMessage).toHaveBeenCalledWith(
                'Sentry Msg',
                expect.objectContaining({ level: 'warning' })
            );
        });

        it('should set user in Sentry', async () => {
            const { setUser } = await import('@/lib/monitoring');
            await setUser({ id: '123' });

            expect(mockSentry.setUser).toHaveBeenCalledWith(
                expect.objectContaining({ id: '123' })
            );
        });

        it('should clear user in Sentry', async () => {
            const { setUser } = await import('@/lib/monitoring');
            await setUser(null);

            expect(mockSentry.setUser).toHaveBeenCalledWith(null);
        });

        it('should add breadcrumb in Sentry', async () => {
            const { addBreadcrumb } = await import('@/lib/monitoring');
            await addBreadcrumb('Click', 'ui');

            expect(mockSentry.addBreadcrumb).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Click',
                    category: 'ui',
                })
            );
        });
    });

    describe('trackPageLoad', () => {
        it('should track page load metrics', async () => {
            const { trackPageLoad, getMetrics } = await import('@/lib/monitoring');

            // Mock window and performance
            vi.stubGlobal('window', {});
            vi.stubGlobal('performance', {
                timing: {
                    navigationStart: 0,
                    loadEventEnd: 100,
                    domContentLoadedEventEnd: 50,
                    requestStart: 0,
                    responseStart: 20,
                },
            });

            trackPageLoad();

            const metrics = getMetrics(10);
            expect(metrics).toEqual(expect.arrayContaining([
                expect.objectContaining({ name: 'page_load', value: 100 }),
                expect.objectContaining({ name: 'dom_ready', value: 50 }),
                expect.objectContaining({ name: 'ttfb', value: 20 }),
            ]));

            vi.unstubAllGlobals();
        });

        it('should do nothing on server side', async () => {
            // Simulate server (no window)
            vi.stubGlobal('window', undefined);
            const { trackPageLoad } = await import('@/lib/monitoring');

            // Check that it doesn't crash
            expect(() => trackPageLoad()).not.toThrow();
            vi.unstubAllGlobals();
        });
    });

    describe('pingHealthCheck', () => {
        it('should return true on success', async () => {
            const { pingHealthCheck } = await import('@/lib/monitoring');
            const result = await pingHealthCheck();
            expect(result).toBe(true);
        });
    });

    describe('Buffer Limits', () => {
        it('should maintain buffer size limit', async () => {
            const { trackMetric, getMetrics } = await import('@/lib/monitoring');

            // Config says 100 max
            for (let i = 0; i < 110; i++) {
                trackMetric({ name: 'test', value: i, unit: 'count' });
            }

            expect(getMetrics(200).length).toBeLessThanOrEqual(100);
        });
    });
});
