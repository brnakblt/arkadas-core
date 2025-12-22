'use client';

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';

interface SessionContextType {
    isActive: boolean;
    remainingTime: number;
    extendSession: () => void;
    logout: () => void;
}

const SessionContext = createContext<SessionContextType | null>(null);

export function useSession() {
    const context = useContext(SessionContext);
    if (!context) {
        throw new Error('useSession must be used within SessionProvider');
    }
    return context;
}

interface SessionProviderProps {
    children: ReactNode;
    /**
     * Session timeout in milliseconds (default: 30 minutes)
     */
    timeout?: number;
    /**
     * Warning threshold in milliseconds (default: 5 minutes before timeout)
     */
    warningThreshold?: number;
    /**
     * Called when session expires
     */
    onTimeout?: () => void;
    /**
     * Called when session is extended
     */
    onExtend?: () => void;
}

const DEFAULT_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const DEFAULT_WARNING = 5 * 60 * 1000; // 5 minutes

export function SessionProvider({
    children,
    timeout = DEFAULT_TIMEOUT,
    warningThreshold = DEFAULT_WARNING,
    onTimeout,
    onExtend,
}: SessionProviderProps) {
    const [lastActivity, setLastActivity] = useState(Date.now());
    const [showWarning, setShowWarning] = useState(false);
    const [remainingTime, setRemainingTime] = useState(timeout);

    // Reset activity timer
    const resetActivity = useCallback(() => {
        setLastActivity(Date.now());
        setShowWarning(false);
    }, []);

    // Extend session
    const extendSession = useCallback(() => {
        resetActivity();
        onExtend?.();
    }, [resetActivity, onExtend]);

    // Logout / timeout handler
    const logout = useCallback(() => {
        onTimeout?.();
    }, [onTimeout]);

    // Track user activity
    useEffect(() => {
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];

        const handleActivity = () => {
            if (!showWarning) {
                resetActivity();
            }
        };

        events.forEach((event) => {
            window.addEventListener(event, handleActivity, { passive: true });
        });

        return () => {
            events.forEach((event) => {
                window.removeEventListener(event, handleActivity);
            });
        };
    }, [resetActivity, showWarning]);

    // Check session status
    useEffect(() => {
        const interval = setInterval(() => {
            const elapsed = Date.now() - lastActivity;
            const remaining = Math.max(0, timeout - elapsed);
            setRemainingTime(remaining);

            if (remaining === 0) {
                logout();
            } else if (remaining <= warningThreshold && !showWarning) {
                setShowWarning(true);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [lastActivity, timeout, warningThreshold, showWarning, logout]);

    return (
        <SessionContext.Provider
            value={{
                isActive: remainingTime > 0,
                remainingTime,
                extendSession,
                logout,
            }}
        >
            {children}
            {showWarning && remainingTime > 0 && (
                <SessionWarningModal
                    remainingTime={remainingTime}
                    onExtend={extendSession}
                    onLogout={logout}
                />
            )}
        </SessionContext.Provider>
    );
}

/**
 * Session Warning Modal
 */
function SessionWarningModal({
    remainingTime,
    onExtend,
    onLogout,
}: {
    remainingTime: number;
    onExtend: () => void;
    onLogout: () => void;
}) {
    const minutes = Math.floor(remainingTime / 60000);
    const seconds = Math.floor((remainingTime % 60000) / 1000);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full mx-4 p-6 text-center">
                <div className="text-5xl mb-4">⏰</div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Oturum Sona Ermek Üzere
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Güvenliğiniz için oturumunuz{' '}
                    <span className="font-bold text-red-500">
                        {minutes}:{seconds.toString().padStart(2, '0')}
                    </span>{' '}
                    içinde sona erecek.
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                    Devam etmek istiyor musunuz?
                </p>
                <div className="flex gap-3">
                    <button
                        onClick={onLogout}
                        className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                        Çıkış Yap
                    </button>
                    <button
                        onClick={onExtend}
                        className="flex-1 px-4 py-2.5 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
                    >
                        Devam Et
                    </button>
                </div>
            </div>
        </div>
    );
}

/**
 * Hook to get formatted remaining time
 */
export function useSessionTimer() {
    const { remainingTime } = useSession();

    const minutes = Math.floor(remainingTime / 60000);
    const seconds = Math.floor((remainingTime % 60000) / 1000);

    return {
        remainingTime,
        formatted: `${minutes}:${seconds.toString().padStart(2, '0')}`,
        isLow: remainingTime < 5 * 60 * 1000,
    };
}
