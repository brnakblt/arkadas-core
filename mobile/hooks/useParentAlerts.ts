/**
 * Parent Alert Service
 * Sends location-based alerts to parents about their children
 */

import { useEffect, useCallback } from 'react';
import usePushNotifications, { sendPushNotification } from './usePushNotifications';
import { useLocation } from './useLocation';

const STRAPI_URL = process.env.EXPO_PUBLIC_STRAPI_URL || 'http://localhost:1337';

interface StudentLocation {
    studentId: string;
    studentName: string;
    parentPushToken: string;
    currentLocation: {
        latitude: number;
        longitude: number;
    };
    status: 'on_bus' | 'at_school' | 'dropped_off' | 'unknown';
    routeId?: string;
    estimatedArrivalMinutes?: number;
}

interface GeofenceZone {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    radius: number; // meters
    type: 'school' | 'stop' | 'home';
}

/**
 * Hook for parent location alert functionality
 */
export function useParentAlerts(studentId: string) {
    const { sendLocalNotification, scheduleNotification } = usePushNotifications();

    // Send immediate alert to parent
    const sendParentAlert = useCallback(async (
        parentToken: string,
        studentName: string,
        alertType: 'boarding' | 'arrival' | 'departure' | 'approaching' | 'delay',
        details?: { location?: string; minutes?: number; reason?: string }
    ) => {
        const messages = {
            boarding: {
                title: '🚌 Servise Biniş',
                body: `${studentName} servise bindi.`,
            },
            arrival: {
                title: '🏫 Okula Varış',
                body: `${studentName} okula ulaştı.`,
            },
            departure: {
                title: '🏠 Okuldan Ayrılış',
                body: `${studentName} okuldan ayrıldı. ${details?.minutes ? `Tahmini varış: ${details.minutes} dakika` : ''}`,
            },
            approaching: {
                title: '📍 Yaklaşıyor',
                body: `${studentName} ${details?.location || 'durağa'} yaklaşıyor. Yaklaşık ${details?.minutes || 5} dakika.`,
            },
            delay: {
                title: '⚠️ Gecikme',
                body: `Servis gecikmesi: ${details?.reason || 'Trafik'}.`,
            },
        };

        const message = messages[alertType];

        // Send push notification
        await sendPushNotification(parentToken, message.title, message.body, {
            type: 'service',
            studentId,
            alertType,
        });
    }, [studentId]);

    // Check if location is within a geofence
    const isWithinGeofence = useCallback((
        location: { latitude: number; longitude: number },
        zone: GeofenceZone
    ): boolean => {
        const R = 6371e3; // Earth's radius in meters
        const φ1 = (location.latitude * Math.PI) / 180;
        const φ2 = (zone.latitude * Math.PI) / 180;
        const Δφ = ((zone.latitude - location.latitude) * Math.PI) / 180;
        const Δλ = ((zone.longitude - location.longitude) * Math.PI) / 180;

        const a =
            Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        const distance = R * c; // Distance in meters

        return distance <= zone.radius;
    }, []);

    return {
        sendParentAlert,
        isWithinGeofence,
    };
}

/**
 * Service for driver to trigger parent notifications
 */
export class ParentAlertService {
    private strapiUrl: string;
    private authToken?: string;

    constructor(authToken?: string) {
        this.strapiUrl = STRAPI_URL;
        this.authToken = authToken;
    }

    private getHeaders(): HeadersInit {
        const headers: HeadersInit = { 'Content-Type': 'application/json' };
        if (this.authToken) {
            headers['Authorization'] = `Bearer ${this.authToken}`;
        }
        return headers;
    }

    /**
     * Notify all parents when service departs from school
     */
    async notifyDeparture(routeId: string): Promise<void> {
        const response = await fetch(`${this.strapiUrl}/api/routes/${routeId}/notify-departure`, {
            method: 'POST',
            headers: this.getHeaders(),
        });

        if (!response.ok) {
            throw new Error('Failed to send departure notifications');
        }
    }

    /**
     * Notify specific parent when approaching their stop
     */
    async notifyApproaching(studentId: string, minutesAway: number): Promise<void> {
        const response = await fetch(`${this.strapiUrl}/api/students/${studentId}/notify-approaching`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({ minutesAway }),
        });

        if (!response.ok) {
            throw new Error('Failed to send approaching notification');
        }
    }

    /**
     * Notify parent when child is dropped off
     */
    async notifyDropOff(studentId: string): Promise<void> {
        const response = await fetch(`${this.strapiUrl}/api/students/${studentId}/notify-dropoff`, {
            method: 'POST',
            headers: this.getHeaders(),
        });

        if (!response.ok) {
            throw new Error('Failed to send drop-off notification');
        }
    }

    /**
     * Notify all parents on a route about a delay
     */
    async notifyDelay(routeId: string, reason: string, estimatedDelay: number): Promise<void> {
        const response = await fetch(`${this.strapiUrl}/api/routes/${routeId}/notify-delay`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({ reason, estimatedDelay }),
        });

        if (!response.ok) {
            throw new Error('Failed to send delay notification');
        }
    }

    /**
     * Get list of students on a route with their parent notification preferences
     */
    async getRouteStudents(routeId: string): Promise<StudentLocation[]> {
        const response = await fetch(
            `${this.strapiUrl}/api/service-routes/${routeId}?populate=students.parent`,
            { headers: this.getHeaders() }
        );

        if (!response.ok) {
            throw new Error('Failed to fetch route students');
        }

        const data = await response.json();
        return data.data?.students || [];
    }
}

export default useParentAlerts;
