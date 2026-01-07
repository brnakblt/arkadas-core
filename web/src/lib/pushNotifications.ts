/* eslint-disable no-console */
/**
 * Arkadaş Push Notification Service
 * 
 * Web push notification service using the Web Push API.
 * Handles subscription management and sending notifications.
 */

/**
 * Push notification payload
 */
export interface PushNotificationPayload {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    image?: string;
    tag?: string;
    data?: Record<string, unknown>;
    actions?: Array<{
        action: string;
        title: string;
        icon?: string;
    }>;
    requireInteraction?: boolean;
    silent?: boolean;
}

/**
 * User subscription info
 */
export interface PushSubscription {
    userId: string;
    endpoint: string;
    keys: {
        p256dh: string;
        auth: string;
    };
    createdAt: Date;
    userAgent?: string;
}

/**
 * Notification types for the app
 */
export type NotificationType =
    | 'attendance'
    | 'schedule'
    | 'message'
    | 'invoice'
    | 'alert'
    | 'reminder'
    | 'report';

/**
 * Push notification templates
 */
const notificationTemplates: Record<NotificationType, (data: Record<string, unknown>) => PushNotificationPayload> = {
    attendance: (data) => ({
        title: 'Yoklama Bildirimi',
        body: `${data.studentName || 'Öğrenci'} ${data.status === 'present' ? 'geldi' : data.status === 'absent' ? 'gelmedi' : 'geç kaldı'}.`,
        icon: '/icons/attendance.png',
        badge: '/icons/badge.png',
        tag: 'attendance',
        data: { type: 'attendance', ...data },
        actions: [
            { action: 'view', title: 'Görüntüle' },
            { action: 'dismiss', title: 'Kapat' },
        ],
    }),

    schedule: (data) => ({
        title: 'Program Hatırlatması',
        body: `${data.eventTitle || 'Etkinlik'} ${data.time || 'yakında'} başlıyor.`,
        icon: '/icons/schedule.png',
        badge: '/icons/badge.png',
        tag: 'schedule',
        data: { type: 'schedule', ...data },
        requireInteraction: true,
        actions: [
            { action: 'view', title: 'Detay' },
            { action: 'snooze', title: 'Ertele' },
        ],
    }),

    message: (data) => ({
        title: data.senderName ? `${data.senderName}` : 'Yeni Mesaj',
        body: String(data.message || 'Yeni bir mesajınız var.'),
        icon: '/icons/message.png',
        badge: '/icons/badge.png',
        tag: `message-${data.conversationId || Date.now()}`,
        data: { type: 'message', ...data },
        actions: [
            { action: 'reply', title: 'Yanıtla' },
            { action: 'view', title: 'Görüntüle' },
        ],
    }),

    invoice: (data) => ({
        title: 'Fatura Bildirimi',
        body: `${data.period || 'Yeni'} dönemi faturanız hazır. Tutar: ${data.amount || '?'} ₺`,
        icon: '/icons/invoice.png',
        badge: '/icons/badge.png',
        tag: 'invoice',
        data: { type: 'invoice', ...data },
        actions: [
            { action: 'view', title: 'Faturayı Gör' },
            { action: 'pay', title: 'Öde' },
        ],
    }),

    alert: (data) => ({
        title: `⚠️ ${data.title || 'Önemli Bildirim'}`,
        body: String(data.message || 'Önemli bir duyuru var.'),
        icon: '/icons/alert.png',
        badge: '/icons/badge.png',
        tag: 'alert',
        data: { type: 'alert', ...data },
        requireInteraction: true,
        actions: [
            { action: 'view', title: 'Detay' },
        ],
    }),

    reminder: (data) => ({
        title: '🔔 Hatırlatma',
        body: String(data.message || 'Hatırlatma zamanı geldi.'),
        icon: '/icons/reminder.png',
        badge: '/icons/badge.png',
        tag: `reminder-${data.reminderId || Date.now()}`,
        data: { type: 'reminder', ...data },
        actions: [
            { action: 'complete', title: 'Tamamla' },
            { action: 'snooze', title: 'Ertele' },
        ],
    }),

    report: (data) => ({
        title: '📊 Rapor Hazır',
        body: `${data.reportType || 'Rapor'} indirilmeye hazır.`,
        icon: '/icons/report.png',
        badge: '/icons/badge.png',
        tag: 'report',
        data: { type: 'report', ...data },
        actions: [
            { action: 'download', title: 'İndir' },
            { action: 'view', title: 'Görüntüle' },
        ],
    }),
};

/**
 * In-memory subscription store (use database in production)
 */
const subscriptionStore = new Map<string, PushSubscription[]>();

/**
 * VAPID keys configuration
 * Generate with: npx web-push generate-vapid-keys
 */
const getVapidKeys = () => ({
    publicKey: process.env.VAPID_PUBLIC_KEY || '',
    privateKey: process.env.VAPID_PRIVATE_KEY || '',
    subject: process.env.VAPID_SUBJECT || 'mailto:admin@arkadas.com.tr',
});

/**
 * Push notification service
 */
export const pushNotificationService = {
    /**
     * Get VAPID public key for client subscription
     */
    getPublicKey(): string {
        return getVapidKeys().publicKey;
    },

    /**
     * Subscribe a user to push notifications
     */
    subscribe(userId: string, subscription: Omit<PushSubscription, 'userId' | 'createdAt'>): boolean {
        try {
            const existingSubscriptions = subscriptionStore.get(userId) || [];

            // Check if already subscribed
            const exists = existingSubscriptions.some((s) => s.endpoint === subscription.endpoint);
            if (exists) {
                return true;
            }

            const newSubscription: PushSubscription = {
                userId,
                endpoint: subscription.endpoint,
                keys: subscription.keys,
                createdAt: new Date(),
                userAgent: subscription.userAgent,
            };

            existingSubscriptions.push(newSubscription);
            subscriptionStore.set(userId, existingSubscriptions);

            console.debug(`Push subscription added for user: ${userId}`);
            return true;
        } catch (error) {
            console.error('Failed to add push subscription:', error);
            return false;
        }
    },

    /**
     * Unsubscribe a user from push notifications
     */
    unsubscribe(userId: string, endpoint?: string): boolean {
        try {
            if (!endpoint) {
                // Remove all subscriptions for user
                subscriptionStore.delete(userId);
            } else {
                // Remove specific subscription
                const subscriptions = subscriptionStore.get(userId) || [];
                const filtered = subscriptions.filter((s) => s.endpoint !== endpoint);

                if (filtered.length > 0) {
                    subscriptionStore.set(userId, filtered);
                } else {
                    subscriptionStore.delete(userId);
                }
            }

            console.debug(`Push subscription removed for user: ${userId}`);
            return true;
        } catch (error) {
            console.error('Failed to remove push subscription:', error);
            return false;
        }
    },

    /**
     * Send a push notification to a user
     */
    async sendToUser(
        userId: string,
        notificationType: NotificationType,
        data: Record<string, unknown>
    ): Promise<{ success: boolean; sent: number; failed: number }> {
        const subscriptions = subscriptionStore.get(userId);

        if (!subscriptions || subscriptions.length === 0) {
            console.debug(`No push subscriptions for user: ${userId}`);
            return { success: false, sent: 0, failed: 0 };
        }

        const template = notificationTemplates[notificationType];
        if (!template) {
            console.error(`Unknown notification type: ${notificationType}`);
            return { success: false, sent: 0, failed: 0 };
        }

        const payload = template(data);
        const results = { success: true, sent: 0, failed: 0 };

        for (const subscription of subscriptions) {
            try {
                await this.sendPushMessage(subscription, payload);
                results.sent++;
            } catch (error) {
                results.failed++;
                console.error(`Push failed for ${subscription.endpoint}:`, error);

                // Remove invalid subscriptions
                if (error instanceof Error && error.message.includes('410')) {
                    this.unsubscribe(userId, subscription.endpoint);
                }
            }
        }

        results.success = results.sent > 0;
        return results;
    },

    /**
     * Send a push notification to multiple users
     */
    async sendToUsers(
        userIds: string[],
        notificationType: NotificationType,
        data: Record<string, unknown>
    ): Promise<{ totalSent: number; totalFailed: number }> {
        const results = { totalSent: 0, totalFailed: 0 };

        for (const userId of userIds) {
            const result = await this.sendToUser(userId, notificationType, data);
            results.totalSent += result.sent;
            results.totalFailed += result.failed;
        }

        return results;
    },

    /**
     * Send a push notification to all subscribed users
     */
    async broadcast(
        notificationType: NotificationType,
        data: Record<string, unknown>
    ): Promise<{ totalSent: number; totalFailed: number }> {
        const allUserIds = Array.from(subscriptionStore.keys());
        return this.sendToUsers(allUserIds, notificationType, data);
    },

    /**
     * Send custom notification payload
     */
    async sendCustom(
        userId: string,
        payload: PushNotificationPayload
    ): Promise<{ success: boolean; sent: number; failed: number }> {
        const subscriptions = subscriptionStore.get(userId);

        if (!subscriptions || subscriptions.length === 0) {
            return { success: false, sent: 0, failed: 0 };
        }

        const results = { success: true, sent: 0, failed: 0 };

        for (const subscription of subscriptions) {
            try {
                await this.sendPushMessage(subscription, payload);
                results.sent++;
            } catch {
                results.failed++;
            }
        }

        results.success = results.sent > 0;
        return results;
    },

    /**
     * Internal: Send push message via web-push
     */
    async sendPushMessage(
        subscription: PushSubscription,
        payload: PushNotificationPayload
    ): Promise<void> {
        // In a real implementation, use the web-push library:
        // import webpush from 'web-push';
        // webpush.setVapidDetails(vapidSubject, publicKey, privateKey);
        // await webpush.sendNotification(subscription, JSON.stringify(payload));

        // For now, simulate the push
        console.debug(`Push notification sent to ${subscription.endpoint}:`, payload.title);

        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 50));
    },

    /**
     * Get all subscriptions for a user (for debugging/admin)
     */
    getSubscriptions(userId: string): PushSubscription[] {
        return subscriptionStore.get(userId) || [];
    },

    /**
     * Get total subscription count
     */
    getTotalSubscriptions(): number {
        let count = 0;
        for (const subs of subscriptionStore.values()) {
            count += subs.length;
        }
        return count;
    },
};

export default pushNotificationService;
