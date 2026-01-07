'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface Location {
    latitude: number;
    longitude: number;
    accuracy?: number;
    speed?: number;
    heading?: number;
    timestamp: number;
}

interface UseGPSTrackingOptions {
    enableHighAccuracy?: boolean;
    updateInterval?: number; // ms
    onLocationUpdate?: (location: Location) => void;
    onError?: (error: GeolocationPositionError) => void;
}

interface UseGPSTrackingReturn {
    location: Location | null;
    isTracking: boolean;
    error: string | null;
    startTracking: () => void;
    stopTracking: () => void;
    getCurrentLocation: () => Promise<Location>;
}

export function useGPSTracking(options: UseGPSTrackingOptions = {}): UseGPSTrackingReturn {
    const {
        enableHighAccuracy = true,
        updateInterval = 5000,
        onLocationUpdate,
        onError,
    } = options;

    const [location, setLocation] = useState<Location | null>(null);
    const [isTracking, setIsTracking] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const watchIdRef = useRef<number | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const processPosition = useCallback((position: GeolocationPosition): Location => {
        const loc: Location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            speed: position.coords.speed ?? undefined,
            heading: position.coords.heading ?? undefined,
            timestamp: position.timestamp,
        };
        return loc;
    }, []);

    const getCurrentLocation = useCallback((): Promise<Location> => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const loc = processPosition(position);
                    setLocation(loc);
                    setError(null);
                    resolve(loc);
                },
                (err) => {
                    setError(err.message);
                    onError?.(err);
                    reject(err);
                },
                { enableHighAccuracy, timeout: 10000, maximumAge: 0 }
            );
        });
    }, [enableHighAccuracy, onError, processPosition]);

    const startTracking = useCallback(() => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser');
            return;
        }

        setIsTracking(true);
        setError(null);

        // Use watchPosition for continuous tracking
        watchIdRef.current = navigator.geolocation.watchPosition(
            (position) => {
                const loc = processPosition(position);
                setLocation(loc);
                setError(null);
                onLocationUpdate?.(loc);
            },
            (err) => {
                setError(err.message);
                onError?.(err);
            },
            { enableHighAccuracy, timeout: 10000, maximumAge: updateInterval }
        );

        // Also set interval for guaranteed updates
        intervalRef.current = setInterval(() => {
            getCurrentLocation().catch(() => { });
        }, updateInterval);
    }, [enableHighAccuracy, updateInterval, onLocationUpdate, onError, getCurrentLocation, processPosition]);

    const stopTracking = useCallback(() => {
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
        if (intervalRef.current !== null) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        setIsTracking(false);
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopTracking();
        };
    }, [stopTracking]);

    return {
        location,
        isTracking,
        error,
        startTracking,
        stopTracking,
        getCurrentLocation,
    };
}

export default useGPSTracking;
