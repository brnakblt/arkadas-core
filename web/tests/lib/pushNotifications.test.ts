/**
 * Push Notifications Service Tests
 * 
 * Unit tests for the push notification service.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { pushNotificationService } from '@/lib/pushNotifications';

describe('PushNotificationService', () => {
    beforeEach(() => {
        // Reset the service state before each test
        vi.clearAllMocks();
    });

    // ============================================================
    // Public Key Tests
    // ============================================================
    describe('getPublicKey', () => {
        it('should return a string', () => {
            const key = pushNotificationService.getPublicKey();
            expect(typeof key).toBe('string');
        });

        it('should use environment variable for key', () => {
            vi.stubEnv('VAPID_PUBLIC_KEY', 'test-public-key');
            expect(pushNotificationService.getPublicKey()).toBe('test-public-key');
            vi.unstubAllEnvs();
        });
    });

    // ============================================================
    // Subscription Tests
    // ============================================================
    describe('subscribe', () => {
        it('should add a new subscription', () => {
            const result = pushNotificationService.subscribe('user123', {
                endpoint: 'https://push.example.com/user123',
                keys: {
                    p256dh: 'test-p256dh-key',
                    auth: 'test-auth-key',
                },
            });

            expect(result).toBe(true);
        });

        it('should return true for duplicate subscriptions', () => {
            const subscription = {
                endpoint: 'https://push.example.com/user456',
                keys: {
                    p256dh: 'test-p256dh-key',
                    auth: 'test-auth-key',
                },
            };

            pushNotificationService.subscribe('user456', subscription);
            const result = pushNotificationService.subscribe('user456', subscription);

            expect(result).toBe(true);
        });

        it('should handle multiple subscriptions for same user', () => {
            pushNotificationService.subscribe('user789', {
                endpoint: 'https://push.example.com/device1',
                keys: { p256dh: 'key1', auth: 'auth1' },
            });

            pushNotificationService.subscribe('user789', {
                endpoint: 'https://push.example.com/device2',
                keys: { p256dh: 'key2', auth: 'auth2' },
            });

            const subscriptions = pushNotificationService.getSubscriptions('user789');
            expect(subscriptions).toHaveLength(2);
        });
    });

    // ============================================================
    // Unsubscribe Tests
    // ============================================================
    describe('unsubscribe', () => {
        it('should remove all subscriptions for a user', () => {
            pushNotificationService.subscribe('userToRemove', {
                endpoint: 'https://push.example.com/remove',
                keys: { p256dh: 'key', auth: 'auth' },
            });

            const result = pushNotificationService.unsubscribe('userToRemove');
            expect(result).toBe(true);

            const subscriptions = pushNotificationService.getSubscriptions('userToRemove');
            expect(subscriptions).toHaveLength(0);
        });

        it('should remove specific endpoint', () => {
            const endpoint1 = 'https://push.example.com/endpoint1';
            const endpoint2 = 'https://push.example.com/endpoint2';

            pushNotificationService.subscribe('userMulti', {
                endpoint: endpoint1,
                keys: { p256dh: 'key1', auth: 'auth1' },
            });
            pushNotificationService.subscribe('userMulti', {
                endpoint: endpoint2,
                keys: { p256dh: 'key2', auth: 'auth2' },
            });

            pushNotificationService.unsubscribe('userMulti', endpoint1);

            const subscriptions = pushNotificationService.getSubscriptions('userMulti');
            expect(subscriptions).toHaveLength(1);
            expect(subscriptions[0].endpoint).toBe(endpoint2);
        });
    });

    // ============================================================
    // Send Notification Tests
    // ============================================================
    describe('sendToUser', () => {
        it('should return success false when user has no subscriptions', async () => {
            const result = await pushNotificationService.sendToUser(
                'nonexistentUser',
                'message',
                { message: 'Test' }
            );

            expect(result.success).toBe(false);
            expect(result.sent).toBe(0);
        });

        it('should send notification to subscribed user', async () => {
            pushNotificationService.subscribe('pushTestUser', {
                endpoint: 'https://push.example.com/test',
                keys: { p256dh: 'key', auth: 'auth' },
            });

            const result = await pushNotificationService.sendToUser(
                'pushTestUser',
                'attendance',
                { studentName: 'Test Student', status: 'present' }
            );

            expect(result.failed).toBe(0);
        });

        it('should remove subscription on 410 error', async () => {
            const userId = 'user410';
            const endpoint = 'https://push.example.com/410';

            pushNotificationService.subscribe(userId, {
                endpoint,
                keys: { p256dh: 'k', auth: 'a' }
            });

            // Mock sendPushMessage to throw 410
            vi.spyOn(pushNotificationService, 'sendPushMessage').mockRejectedValueOnce(new Error('410 Gone'));

            await pushNotificationService.sendToUser(userId, 'attendance', { status: 'absent' });

            const subs = pushNotificationService.getSubscriptions(userId);
            expect(subs).toHaveLength(0); // Should be removed
        });
    });

    // ============================================================
    // Broadcast Tests
    // ============================================================
    describe('broadcast', () => {
        it('should send to all subscribed users', async () => {
            // Subscribe multiple users
            pushNotificationService.subscribe('broadcastUser1', {
                endpoint: 'https://push.example.com/broadcast1',
                keys: { p256dh: 'key1', auth: 'auth1' },
            });
            pushNotificationService.subscribe('broadcastUser2', {
                endpoint: 'https://push.example.com/broadcast2',
                keys: { p256dh: 'key2', auth: 'auth2' },
            });

            const result = await pushNotificationService.broadcast('alert', {
                title: 'Test Alert',
                message: 'This is a test',
            });

            expect(result.totalSent).toBeGreaterThanOrEqual(2);
        });
    });

    // ============================================================
    // Custom Notification Tests
    // ============================================================
    describe('sendCustom', () => {
        it('should send custom notification payload', async () => {
            pushNotificationService.subscribe('customUser', {
                endpoint: 'https://push.example.com/custom',
                keys: { p256dh: 'key', auth: 'auth' },
            });

            const result = await pushNotificationService.sendCustom('customUser', {
                title: 'Custom Title',
                body: 'Custom body text',
                icon: '/custom-icon.png',
                requireInteraction: true,
            });

            expect(result.success).toBe(true);
        });
    });

    // ============================================================
    // Statistics Tests
    // ============================================================
    describe('getTotalSubscriptions', () => {
        it('should return total subscription count', () => {
            const initialCount = pushNotificationService.getTotalSubscriptions();

            pushNotificationService.subscribe('statsUser', {
                endpoint: 'https://push.example.com/stats',
                keys: { p256dh: 'key', auth: 'auth' },
            });

            const newCount = pushNotificationService.getTotalSubscriptions();
            expect(newCount).toBe(initialCount + 1);
        });
    });
});
