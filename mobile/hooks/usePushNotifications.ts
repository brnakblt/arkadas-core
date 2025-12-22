/**
 * Push Notification Service for React Native Expo
 * Handles notification permissions, tokens, and listeners
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Configure notification behavior
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

interface NotificationData {
    type?: 'attendance' | 'service' | 'message' | 'alert';
    studentId?: string;
    routeId?: string;
    url?: string;
    [key: string]: unknown;
}

interface UsePushNotificationsReturn {
    expoPushToken: string | null;
    notification: Notifications.Notification | null;
    error: string | null;
    requestPermission: () => Promise<boolean>;
    sendLocalNotification: (title: string, body: string, data?: NotificationData) => Promise<void>;
    scheduleNotification: (title: string, body: string, trigger: Notifications.NotificationTriggerInput, data?: NotificationData) => Promise<string>;
    cancelNotification: (id: string) => Promise<void>;
    cancelAllNotifications: () => Promise<void>;
}

const STRAPI_URL = process.env.EXPO_PUBLIC_STRAPI_URL || 'http://localhost:1337';

export function usePushNotifications(): UsePushNotificationsReturn {
    const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
    const [notification, setNotification] = useState<Notifications.Notification | null>(null);
    const [error, setError] = useState<string | null>(null);

    const notificationListener = useRef<Notifications.Subscription>();
    const responseListener = useRef<Notifications.Subscription>();

    // Register for push notifications
    const registerForPushNotifications = useCallback(async (): Promise<string | null> => {
        if (!Device.isDevice) {
            setError('Push notifications require a physical device');
            return null;
        }

        // Check existing permissions
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        // Request permission if not granted
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            setError('Bildirim izni verilmedi');
            return null;
        }

        // Get Expo push token
        try {
            const projectId = Constants.expoConfig?.extra?.eas?.projectId;
            const tokenData = await Notifications.getExpoPushTokenAsync({
                projectId,
            });

            const token = tokenData.data;
            setExpoPushToken(token);

            // Register token with backend
            await registerTokenWithBackend(token);

            return token;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Token alınamadı';
            setError(message);
            return null;
        }
    }, []);

    // Register token with Strapi backend
    const registerTokenWithBackend = async (token: string) => {
        try {
            await fetch(`${STRAPI_URL}/api/push-tokens`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    data: {
                        token,
                        platform: Platform.OS,
                        deviceName: Device.deviceName,
                    },
                }),
            });
        } catch (err) {
            console.error('Failed to register push token:', err);
        }
    };

    // Request permission
    const requestPermission = useCallback(async (): Promise<boolean> => {
        const token = await registerForPushNotifications();
        return token !== null;
    }, [registerForPushNotifications]);

    // Send local notification
    const sendLocalNotification = useCallback(async (
        title: string,
        body: string,
        data?: NotificationData
    ): Promise<void> => {
        await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                data: data as Record<string, unknown>,
                sound: true,
            },
            trigger: null, // Immediate
        });
    }, []);

    // Schedule notification for later
    const scheduleNotification = useCallback(async (
        title: string,
        body: string,
        trigger: Notifications.NotificationTriggerInput,
        data?: NotificationData
    ): Promise<string> => {
        return await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                data: data as Record<string, unknown>,
                sound: true,
            },
            trigger,
        });
    }, []);

    // Cancel specific notification
    const cancelNotification = useCallback(async (id: string): Promise<void> => {
        await Notifications.cancelScheduledNotificationAsync(id);
    }, []);

    // Cancel all notifications
    const cancelAllNotifications = useCallback(async (): Promise<void> => {
        await Notifications.cancelAllScheduledNotificationsAsync();
    }, []);

    // Set up notification listeners
    useEffect(() => {
        // Configure Android channel
        if (Platform.OS === 'android') {
            Notifications.setNotificationChannelAsync('default', {
                name: 'Varsayılan',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#3B82F6',
            });

            Notifications.setNotificationChannelAsync('service', {
                name: 'Servis Bildirimleri',
                importance: Notifications.AndroidImportance.HIGH,
                vibrationPattern: [0, 500, 250, 500],
                lightColor: '#10B981',
            });

            Notifications.setNotificationChannelAsync('attendance', {
                name: 'Yoklama Bildirimleri',
                importance: Notifications.AndroidImportance.HIGH,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#6366F1',
            });
        }

        // Register for push notifications on mount
        registerForPushNotifications();

        // Listener for received notifications (app in foreground)
        notificationListener.current = Notifications.addNotificationReceivedListener(
            (notification) => {
                setNotification(notification);
            }
        );

        // Listener for notification interactions (taps)
        responseListener.current = Notifications.addNotificationResponseReceivedListener(
            (response) => {
                const data = response.notification.request.content.data as NotificationData;
                handleNotificationResponse(data);
            }
        );

        return () => {
            if (notificationListener.current) {
                Notifications.removeNotificationSubscription(notificationListener.current);
            }
            if (responseListener.current) {
                Notifications.removeNotificationSubscription(responseListener.current);
            }
        };
    }, [registerForPushNotifications]);

    return {
        expoPushToken,
        notification,
        error,
        requestPermission,
        sendLocalNotification,
        scheduleNotification,
        cancelNotification,
        cancelAllNotifications,
    };
}

// Handle notification tap (navigation)
function handleNotificationResponse(data: NotificationData) {
    console.log('Notification tapped:', data);

    // Navigate based on notification type
    // This would typically use expo-router or react-navigation
    switch (data.type) {
        case 'attendance':
            // Navigate to attendance screen
            console.log('Navigate to attendance for student:', data.studentId);
            break;
        case 'service':
            // Navigate to service tracking
            console.log('Navigate to service tracking for route:', data.routeId);
            break;
        case 'message':
            // Navigate to messages
            console.log('Navigate to messages');
            break;
        default:
            // Navigate to home or specified URL
            if (data.url) {
                console.log('Navigate to:', data.url);
            }
    }
}

// Utility function to send push notification via Expo's push service
export async function sendPushNotification(
    expoPushToken: string,
    title: string,
    body: string,
    data?: NotificationData
): Promise<void> {
    const message = {
        to: expoPushToken,
        sound: 'default',
        title,
        body,
        data,
    };

    await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Accept-encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
    });
}

export default usePushNotifications;
