import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { useEffect, useState, useCallback, useRef } from 'react';

// ============================================================
// Storage Keys
// ============================================================

const STORAGE_KEYS = {
    PENDING_SYNC: '@offline/pending_sync',
    CACHED_DATA: '@offline/cached_data',
    LAST_SYNC: '@offline/last_sync',
    USER_DATA: '@offline/user_data',
    ATTENDANCE_QUEUE: '@offline/attendance_queue',
    LOCATION_QUEUE: '@offline/location_queue',
};

// ============================================================
// Types
// ============================================================

interface SyncItem {
    id: string;
    type: 'attendance' | 'location' | 'update';
    data: unknown;
    timestamp: string;
    retries: number;
}

interface CachedData {
    key: string;
    data: unknown;
    cachedAt: string;
    expiresAt?: string;
}

// ============================================================
// Offline Storage Service
// ============================================================

export const offlineStorage = {
    // Save data
    async save(key: string, data: unknown): Promise<void> {
        try {
            await AsyncStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            console.error('Offline storage save error:', error);
        }
    },

    // Load data
    async load<T>(key: string): Promise<T | null> {
        try {
            const data = await AsyncStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Offline storage load error:', error);
            return null;
        }
    },

    // Remove data
    async remove(key: string): Promise<void> {
        try {
            await AsyncStorage.removeItem(key);
        } catch (error) {
            console.error('Offline storage remove error:', error);
        }
    },

    // Clear all offline data
    async clear(): Promise<void> {
        try {
            const keys = Object.values(STORAGE_KEYS);
            await AsyncStorage.multiRemove(keys);
        } catch (error) {
            console.error('Offline storage clear error:', error);
        }
    },
};

// ============================================================
// Sync Queue
// ============================================================

export const syncQueue = {
    // Add item to sync queue
    async add(type: SyncItem['type'], data: unknown): Promise<void> {
        const item: SyncItem = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type,
            data,
            timestamp: new Date().toISOString(),
            retries: 0,
        };

        const queue = await offlineStorage.load<SyncItem[]>(STORAGE_KEYS.PENDING_SYNC) || [];
        queue.push(item);
        await offlineStorage.save(STORAGE_KEYS.PENDING_SYNC, queue);
    },

    // Get all pending items
    async getAll(): Promise<SyncItem[]> {
        return await offlineStorage.load<SyncItem[]>(STORAGE_KEYS.PENDING_SYNC) || [];
    },

    // Remove synced item
    async remove(id: string): Promise<void> {
        const queue = await offlineStorage.load<SyncItem[]>(STORAGE_KEYS.PENDING_SYNC) || [];
        const filtered = queue.filter(item => item.id !== id);
        await offlineStorage.save(STORAGE_KEYS.PENDING_SYNC, filtered);
    },

    // Update retry count
    async incrementRetry(id: string): Promise<void> {
        const queue = await offlineStorage.load<SyncItem[]>(STORAGE_KEYS.PENDING_SYNC) || [];
        const updated = queue.map(item =>
            item.id === id ? { ...item, retries: item.retries + 1 } : item
        );
        await offlineStorage.save(STORAGE_KEYS.PENDING_SYNC, updated);
    },

    // Clear queue
    async clear(): Promise<void> {
        await offlineStorage.save(STORAGE_KEYS.PENDING_SYNC, []);
    },
};

// ============================================================
// Data Caching
// ============================================================

export const dataCache = {
    // Cache data with optional expiry
    async set(key: string, data: unknown, expiryMinutes?: number): Promise<void> {
        const cached: CachedData = {
            key,
            data,
            cachedAt: new Date().toISOString(),
            expiresAt: expiryMinutes
                ? new Date(Date.now() + expiryMinutes * 60000).toISOString()
                : undefined,
        };

        const allCached = await offlineStorage.load<Record<string, CachedData>>(STORAGE_KEYS.CACHED_DATA) || {};
        allCached[key] = cached;
        await offlineStorage.save(STORAGE_KEYS.CACHED_DATA, allCached);
    },

    // Get cached data
    async get<T>(key: string): Promise<T | null> {
        const allCached = await offlineStorage.load<Record<string, CachedData>>(STORAGE_KEYS.CACHED_DATA) || {};
        const cached = allCached[key];

        if (!cached) return null;

        // Check expiry
        if (cached.expiresAt && new Date(cached.expiresAt) < new Date()) {
            delete allCached[key];
            await offlineStorage.save(STORAGE_KEYS.CACHED_DATA, allCached);
            return null;
        }

        return cached.data as T;
    },

    // Clear expired cache
    async clearExpired(): Promise<void> {
        const allCached = await offlineStorage.load<Record<string, CachedData>>(STORAGE_KEYS.CACHED_DATA) || {};
        const now = new Date();

        const valid: Record<string, CachedData> = {};
        for (const [key, cached] of Object.entries(allCached)) {
            if (!cached.expiresAt || new Date(cached.expiresAt) > now) {
                valid[key] = cached;
            }
        }

        await offlineStorage.save(STORAGE_KEYS.CACHED_DATA, valid);
    },
};

// ============================================================
// Hooks
// ============================================================

/**
 * Network status hook
 */
export function useNetworkStatus() {
    const [isConnected, setIsConnected] = useState<boolean | null>(true);
    const [connectionType, setConnectionType] = useState<string>('unknown');

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
            setIsConnected(state.isConnected);
            setConnectionType(state.type);
        });

        return () => unsubscribe();
    }, []);

    return { isConnected, connectionType };
}

/**
 * Offline-first data hook
 */
export function useOfflineData<T>(
    key: string,
    fetchFn: () => Promise<T>,
    cacheMinutes: number = 30
) {
    const [data, setData] = useState<T | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [isStale, setIsStale] = useState(false);
    const { isConnected } = useNetworkStatus();

    const loadData = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Try cache first
            const cached = await dataCache.get<T>(key);
            if (cached) {
                setData(cached);
                setIsStale(true);
            }

            // Fetch fresh data if online
            if (isConnected) {
                const fresh = await fetchFn();
                setData(fresh);
                setIsStale(false);
                await dataCache.set(key, fresh, cacheMinutes);
            } else if (!cached) {
                throw new Error('Çevrimdışı ve önbellek boş');
            }
        } catch (err) {
            setError(err as Error);
        } finally {
            setIsLoading(false);
        }
    }, [key, fetchFn, cacheMinutes, isConnected]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    return { data, isLoading, error, isStale, refetch: loadData };
}

/**
 * Sync queue hook
 */
export function useSyncQueue() {
    const [pendingCount, setPendingCount] = useState(0);
    const [isSyncing, setIsSyncing] = useState(false);
    const { isConnected } = useNetworkStatus();
    const syncRef = useRef(false);

    // Load pending count
    useEffect(() => {
        const loadCount = async () => {
            const queue = await syncQueue.getAll();
            setPendingCount(queue.length);
        };
        loadCount();
    }, []);

    // Auto-sync when online
    useEffect(() => {
        if (isConnected && pendingCount > 0 && !syncRef.current) {
            syncAll();
        }
    }, [isConnected, pendingCount]);

    const syncAll = useCallback(async () => {
        if (syncRef.current) return;
        syncRef.current = true;
        setIsSyncing(true);

        try {
            const queue = await syncQueue.getAll();

            for (const item of queue) {
                if (item.retries >= 3) {
                    await syncQueue.remove(item.id);
                    continue;
                }

                try {
                    await syncItem(item);
                    await syncQueue.remove(item.id);
                } catch {
                    await syncQueue.incrementRetry(item.id);
                }
            }

            const remaining = await syncQueue.getAll();
            setPendingCount(remaining.length);
        } finally {
            setIsSyncing(false);
            syncRef.current = false;
        }
    }, []);

    const addToQueue = useCallback(async (type: SyncItem['type'], data: unknown) => {
        await syncQueue.add(type, data);
        setPendingCount(prev => prev + 1);
    }, []);

    return { pendingCount, isSyncing, syncAll, addToQueue };
}

// Sync single item to server
async function syncItem(item: SyncItem): Promise<void> {
    const STRAPI_URL = process.env.EXPO_PUBLIC_STRAPI_URL || 'http://localhost:1337';

    const endpoints: Record<SyncItem['type'], string> = {
        attendance: '/api/attendance-logs',
        location: '/api/location-updates',
        update: '/api/sync',
    };

    const response = await fetch(`${STRAPI_URL}${endpoints[item.type]}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: item.data }),
    });

    if (!response.ok) {
        throw new Error('Sync failed');
    }
}
