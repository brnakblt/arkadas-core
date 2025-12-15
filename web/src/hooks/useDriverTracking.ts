'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import useGPSTracking from './useGPSTracking';
import { getStrapiURL } from '@/lib/api';

interface DriverTrackingOptions {
    routeId?: string;
    updateInterval?: number;
}

export function useDriverTracking({ routeId, updateInterval = 10000 }: DriverTrackingOptions = {}) {
    const { location, isTracking, error: gpsError, startTracking: startGps, stopTracking: stopGps } = useGPSTracking({
        updateInterval,
        enableHighAccuracy: true
    });

    const [isSending, setIsSending] = useState(false);
    const [lastSentTime, setLastSentTime] = useState<Date | null>(null);
    const [sendError, setSendError] = useState<string | null>(null);
    const [totalSent, setTotalSent] = useState(0);

    // Send location to backend whenever location updates
    useEffect(() => {
        if (!isTracking || !location || !routeId) return;

        // Throttling: don't send if sent very recently (within 5s) unless it's a significant move?
        // For now, rely on useGPSTracking's update interval, but we can add a check here.
        const now = new Date();
        if (lastSentTime && now.getTime() - lastSentTime.getTime() < 5000) {
            return;
        }

        const sendLocation = async () => {
            setIsSending(true);
            try {
                // We need the user's token here. Assuming it's stored in localStorage or handled by a session provider.
                // For now, we will fallback to a public endpoint or assume auth header is handled globally if using a custom fetch wrapper.
                // But since this is a new hook, let's try to use standard fetch with token from localStorage if available.

                // TODO: Replace with proper auth context usage
                const token = localStorage.getItem('jwt');

                const payload = {
                    data: {
                        latitude: location.latitude,
                        longitude: location.longitude,
                        speedKmh: location.speed ? location.speed * 3.6 : 0, // m/s to km/h
                        heading: location.heading,
                        accuracyMeters: location.accuracy,
                        recordedAt: new Date(location.timestamp).toISOString(),
                        route: routeId,
                        // User should be inferred from token by Strapi
                        source: 'gps'
                    }
                };

                const response = await fetch(`${getStrapiURL()}/api/location-logs`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                    },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    throw new Error(`Failed to send location: ${response.statusText}`);
                }

                setLastSentTime(now);
                setTotalSent(prev => prev + 1);
                setSendError(null);
            } catch (err: any) {
                console.error('Error sending location:', err);
                setSendError(err.message);
            } finally {
                setIsSending(false);
            }
        };

        sendLocation();

    }, [location, isTracking, routeId]);

    return {
        location,
        isTracking,
        isSending,
        lastSentTime,
        totalSent,
        error: gpsError || sendError,
        startTracking: startGps,
        stopTracking: stopGps
    };
}
