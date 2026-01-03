/**
 * Push Notifications Service
 * Handles registration, permissions, and notification display
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { api } from './api';

// Configure notification behavior
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

export interface PushNotification {
    id: string;
    title: string;
    body: string;
    data?: Record<string, unknown>;
    createdAt: Date;
    read: boolean;
}

class NotificationService {
    private expoPushToken: string | null = null;

    /**
     * Register for push notifications and get Expo push token
     */
    async register(): Promise<string | null> {
        if (!Device.isDevice) {
            console.log('[Notifications] Must use physical device');
            return null;
        }

        // Check existing permissions
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        // Request if not granted
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('[Notifications] Permission not granted');
            return null;
        }

        // Get Expo push token
        try {
            const tokenResponse = await Notifications.getExpoPushTokenAsync({
                projectId: 'arkadas-mobile', // Must match app.json
            });
            this.expoPushToken = tokenResponse.data;
            console.log('[Notifications] Token:', this.expoPushToken);

            // Register token with backend
            await this.registerTokenWithBackend(this.expoPushToken);

            return this.expoPushToken;
        } catch (error) {
            console.error('[Notifications] Token registration failed:', error);
            return null;
        }
    }

    /**
     * Register push token with Strapi backend
     */
    private async registerTokenWithBackend(token: string): Promise<void> {
        try {
            await api.fetch('/api/device-tokens', {
                method: 'POST',
                body: JSON.stringify({
                    data: {
                        token,
                        platform: Platform.OS,
                        deviceName: Device.deviceName || 'Unknown',
                        isActive: true,
                    },
                }),
            });
            console.log('[Notifications] Token registered with backend');
        } catch (error) {
            console.error('[Notifications] Backend registration failed:', error);
        }
    }

    /**
     * Set up notification listeners
     */
    setupListeners(
        onNotificationReceived?: (notification: Notifications.Notification) => void,
        onNotificationResponse?: (response: Notifications.NotificationResponse) => void
    ): () => void {
        const receivedSubscription = Notifications.addNotificationReceivedListener(
            (notification) => {
                console.log('[Notifications] Received:', notification);
                onNotificationReceived?.(notification);
            }
        );

        const responseSubscription = Notifications.addNotificationResponseReceivedListener(
            (response) => {
                console.log('[Notifications] Response:', response);
                onNotificationResponse?.(response);
            }
        );

        // Return cleanup function
        return () => {
            receivedSubscription.remove();
            responseSubscription.remove();
        };
    }

    /**
     * Schedule a local notification
     */
    async scheduleLocal(
        title: string,
        body: string,
        trigger: Notifications.NotificationTriggerInput = null,
        data?: Record<string, unknown>
    ): Promise<string> {
        return Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                data,
                sound: true,
            },
            trigger,
        });
    }

    /**
     * Cancel a scheduled notification
     */
    async cancel(notificationId: string): Promise<void> {
        await Notifications.cancelScheduledNotificationAsync(notificationId);
    }

    /**
     * Cancel all scheduled notifications
     */
    async cancelAll(): Promise<void> {
        await Notifications.cancelAllScheduledNotificationsAsync();
    }

    /**
     * Get badge count
     */
    async getBadgeCount(): Promise<number> {
        return Notifications.getBadgeCountAsync();
    }

    /**
     * Set badge count
     */
    async setBadgeCount(count: number): Promise<void> {
        await Notifications.setBadgeCountAsync(count);
    }

    /**
     * Get current push token
     */
    getToken(): string | null {
        return this.expoPushToken;
    }

    /**
     * Configure Android notification channel
     */
    async setupAndroidChannel(): Promise<void> {
        if (Platform.OS !== 'android') return;

        await Notifications.setNotificationChannelAsync('default', {
            name: 'Varsayılan',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#2563eb',
        });

        await Notifications.setNotificationChannelAsync('attendance', {
            name: 'Yoklama Bildirimleri',
            description: 'Öğrenci giriş/çıkış bildirimleri',
            importance: Notifications.AndroidImportance.HIGH,
            sound: 'default',
        });

        await Notifications.setNotificationChannelAsync('messages', {
            name: 'Mesajlar',
            description: 'Yeni mesaj bildirimleri',
            importance: Notifications.AndroidImportance.DEFAULT,
        });
    }
}

export const notifications = new NotificationService();
