'use client';

/**
 * usePlanningSync Hook
 * 
 * WebSocket-based real-time sync for multi-user planning.
 * Enables concurrent editing with conflict resolution.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { PlannedSession, TimeSlot, PlanItem } from './PlanningGrid';

export interface PlanningUser {
    id: string;
    name: string;
    color: string;
    cursor?: { day: number; hour: number };
}

export interface PlanningChange {
    type: 'add' | 'move' | 'remove';
    sessionId: string;
    payload?: Partial<PlannedSession>;
    userId: string;
    timestamp: number;
}

export interface UsePlanningSyncOptions {
    tenantId: string;
    weekId: string; // e.g., "2024-W01"
    userId: string;
    userName: string;
    onConflict?: (change: PlanningChange) => void;
}

export interface UsePlanningSyncReturn {
    sessions: PlannedSession[];
    users: PlanningUser[];
    isConnected: boolean;
    isSyncing: boolean;
    addSession: (item: PlanItem, slot: TimeSlot) => void;
    moveSession: (sessionId: string, newSlot: TimeSlot) => void;
    removeSession: (sessionId: string) => void;
    updateCursor: (day: number, hour: number) => void;
}

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';

export function usePlanningSync(options: UsePlanningSyncOptions): UsePlanningSyncReturn {
    const { tenantId, weekId, userId, userName, onConflict } = options;

    const [sessions, setSessions] = useState<PlannedSession[]>([]);
    const [users, setUsers] = useState<PlanningUser[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const wsRef = useRef<any>(null);
    const pendingChanges = useRef<PlanningChange[]>([]);

    // Generate user color based on ID
    const userColor = useCallback((id: string) => {
        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
        const index = id.charCodeAt(0) % colors.length;
        return colors[index];
    }, []);

    // Connect to WebSocket
    useEffect(() => {
        // SSR safety check
        if (typeof window === 'undefined') return;

        const ws = new window.WebSocket(`${WS_URL}/planning/${tenantId}/${weekId}`);
        wsRef.current = ws;

        ws.onopen = () => {
            setIsConnected(true);
            // Send join message
            ws.send(JSON.stringify({
                type: 'join',
                userId,
                userName,
                color: userColor(userId),
            }));
        };

        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);

            switch (message.type) {
                case 'init':
                    setSessions(message.sessions);
                    setUsers(message.users);
                    break;

                case 'user_join':
                    setUsers((prev) => [...prev, message.user]);
                    break;

                case 'user_leave':
                    setUsers((prev) => prev.filter((u) => u.id !== message.userId));
                    break;

                case 'cursor_update':
                    setUsers((prev) =>
                        prev.map((u) =>
                            u.id === message.userId ? { ...u, cursor: message.cursor } : u
                        )
                    );
                    break;

                case 'session_add':
                    setSessions((prev) => [...prev, message.session]);
                    break;

                case 'session_move':
                    setSessions((prev) =>
                        prev.map((s) =>
                            s.id === message.sessionId ? { ...s, slot: message.newSlot } : s
                        )
                    );
                    break;

                case 'session_remove':
                    setSessions((prev) => prev.filter((s) => s.id !== message.sessionId));
                    break;

                case 'conflict':
                    onConflict?.(message.change);
                    break;
            }
        };

        ws.onclose = () => {
            setIsConnected(false);
        };

        ws.onerror = (error) => {
            console.error('Planning WebSocket error:', error);
            setIsConnected(false);
        };

        return () => {
            ws.close();
        };
    }, [tenantId, weekId, userId, userName, userColor, onConflict]);

    // Send change to server
    const sendChange = useCallback((change: Omit<PlanningChange, 'userId' | 'timestamp'>) => {
        const fullChange: PlanningChange = {
            ...change,
            userId,
            timestamp: Date.now(),
        };

        if (wsRef.current?.readyState === 1) { // WebSocket.OPEN = 1
            wsRef.current.send(JSON.stringify(fullChange));
        } else {
            // Queue for later
            pendingChanges.current.push(fullChange);
        }
    }, [userId]);

    // Add session
    const addSession = useCallback((item: PlanItem, slot: TimeSlot) => {
        const newSession: PlannedSession = {
            ...item,
            id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            slot,
        };

        // Optimistic update
        setSessions((prev) => [...prev, newSession]);
        setIsSyncing(true);

        sendChange({
            type: 'add',
            sessionId: newSession.id,
            payload: newSession,
        });

        setTimeout(() => setIsSyncing(false), 500);
    }, [sendChange]);

    // Move session
    const moveSession = useCallback((sessionId: string, newSlot: TimeSlot) => {
        // Optimistic update
        setSessions((prev) =>
            prev.map((s) => (s.id === sessionId ? { ...s, slot: newSlot } : s))
        );
        setIsSyncing(true);

        sendChange({
            type: 'move',
            sessionId,
            payload: { slot: newSlot },
        });

        setTimeout(() => setIsSyncing(false), 500);
    }, [sendChange]);

    // Remove session
    const removeSession = useCallback((sessionId: string) => {
        // Optimistic update
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
        setIsSyncing(true);

        sendChange({
            type: 'remove',
            sessionId,
        });

        setTimeout(() => setIsSyncing(false), 500);
    }, [sendChange]);

    // Update cursor position
    const updateCursor = useCallback((day: number, hour: number) => {
        if (wsRef.current?.readyState === 1) { // WebSocket.OPEN = 1
            wsRef.current.send(JSON.stringify({
                type: 'cursor',
                userId,
                cursor: { day, hour },
            }));
        }
    }, [userId]);

    return {
        sessions,
        users,
        isConnected,
        isSyncing,
        addSession,
        moveSession,
        removeSession,
        updateCursor,
    };
}

export default usePlanningSync;
