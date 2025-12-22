/**
 * GPS Location Hook for React Native with Expo
 * Handles location permissions, tracking, and updates
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import * as Location from 'expo-location';

interface LocationData {
    latitude: number;
    longitude: number;
    accuracy: number | null;
    altitude: number | null;
    speed: number | null;
    heading: number | null;
    timestamp: number;
}

interface UseLocationOptions {
    enableHighAccuracy?: boolean;
    updateInterval?: number;
    distanceInterval?: number;
    onLocationUpdate?: (location: LocationData) => void;
    onError?: (error: string) => void;
}

interface UseLocationReturn {
    location: LocationData | null;
    isTracking: boolean;
    error: string | null;
    permissionStatus: Location.PermissionStatus | null;
    requestPermission: () => Promise<boolean>;
    startTracking: () => Promise<void>;
    stopTracking: () => void;
    getCurrentLocation: () => Promise<LocationData>;
}

export function useLocation(options: UseLocationOptions = {}): UseLocationReturn {
    const {
        enableHighAccuracy = true,
        updateInterval = 5000,
        distanceInterval = 10,
        onLocationUpdate,
        onError,
    } = options;

    const [location, setLocation] = useState<LocationData | null>(null);
    const [isTracking, setIsTracking] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [permissionStatus, setPermissionStatus] = useState<Location.PermissionStatus | null>(null);

    const subscriptionRef = useRef<Location.LocationSubscription | null>(null);

    // Check permission on mount
    useEffect(() => {
        checkPermission();
        return () => {
            stopTracking();
        };
    }, []);

    const checkPermission = async () => {
        const { status } = await Location.getForegroundPermissionsAsync();
        setPermissionStatus(status);
    };

    const requestPermission = useCallback(async (): Promise<boolean> => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            setPermissionStatus(status);

            if (status !== Location.PermissionStatus.GRANTED) {
                setError('Konum izni verilmedi');
                return false;
            }

            // Also request background permission for service tracking
            const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();

            return status === Location.PermissionStatus.GRANTED;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Konum izni alınamadı';
            setError(message);
            onError?.(message);
            return false;
        }
    }, [onError]);

    const processLocation = (loc: Location.LocationObject): LocationData => {
        return {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            accuracy: loc.coords.accuracy,
            altitude: loc.coords.altitude,
            speed: loc.coords.speed,
            heading: loc.coords.heading,
            timestamp: loc.timestamp,
        };
    };

    const getCurrentLocation = useCallback(async (): Promise<LocationData> => {
        if (permissionStatus !== Location.PermissionStatus.GRANTED) {
            const granted = await requestPermission();
            if (!granted) throw new Error('Konum izni gerekli');
        }

        const loc = await Location.getCurrentPositionAsync({
            accuracy: enableHighAccuracy
                ? Location.Accuracy.High
                : Location.Accuracy.Balanced,
        });

        const locationData = processLocation(loc);
        setLocation(locationData);
        setError(null);

        return locationData;
    }, [permissionStatus, enableHighAccuracy, requestPermission]);

    const startTracking = useCallback(async () => {
        if (isTracking) return;

        if (permissionStatus !== Location.PermissionStatus.GRANTED) {
            const granted = await requestPermission();
            if (!granted) return;
        }

        setIsTracking(true);
        setError(null);

        subscriptionRef.current = await Location.watchPositionAsync(
            {
                accuracy: enableHighAccuracy
                    ? Location.Accuracy.High
                    : Location.Accuracy.Balanced,
                timeInterval: updateInterval,
                distanceInterval: distanceInterval,
            },
            (loc) => {
                const locationData = processLocation(loc);
                setLocation(locationData);
                onLocationUpdate?.(locationData);
            }
        );
    }, [isTracking, permissionStatus, enableHighAccuracy, updateInterval, distanceInterval, requestPermission, onLocationUpdate]);

    const stopTracking = useCallback(() => {
        if (subscriptionRef.current) {
            if (typeof subscriptionRef.current.remove === 'function') {
                subscriptionRef.current.remove();
            } else if (typeof (subscriptionRef.current as any).removeSubscription === 'function') {
                // Fallback for older Expo versions or Web shims
                (subscriptionRef.current as any).removeSubscription();
            }
            subscriptionRef.current = null;
        }
        setIsTracking(false);
    }, []);

    return {
        location,
        isTracking,
        error,
        permissionStatus,
        requestPermission,
        startTracking,
        stopTracking,
        getCurrentLocation,
    };
}

export default useLocation;
