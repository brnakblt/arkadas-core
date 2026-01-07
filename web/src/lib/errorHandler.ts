/* eslint-disable no-console */
'use client';

/**
 * Global Error Handler Utilities
 * 
 * Provides error tracking, reporting, and user-friendly error display.
 */

// ============================================================
// Types
// ============================================================

export interface AppError {
    id: string;
    message: string;
    code?: string;
    timestamp: Date;
    stack?: string;
    context?: Record<string, unknown>;
    severity: 'low' | 'medium' | 'high' | 'critical';
}

interface ErrorReport {
    error: AppError;
    userAgent: string;
    url: string;
    userId?: string;
}

// ============================================================
// Error Store (in-memory for client)
// ============================================================

const errorLog: AppError[] = [];
const MAX_ERRORS = 100;

// ============================================================
// Error Utilities
// ============================================================

/**
 * Generate unique error ID
 */
function generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a standardized error object
 */
export function createAppError(
    error: Error | string,
    options: {
        code?: string;
        context?: Record<string, unknown>;
        severity?: AppError['severity'];
    } = {}
): AppError {
    const { code, context, severity = 'medium' } = options;

    return {
        id: generateErrorId(),
        message: typeof error === 'string' ? error : error.message,
        code,
        timestamp: new Date(),
        stack: typeof error === 'object' ? error.stack : undefined,
        context,
        severity,
    };
}

/**
 * Log error to console and in-memory store
 */
export function logError(error: AppError): void {
    // Add to in-memory log
    errorLog.unshift(error);
    if (errorLog.length > MAX_ERRORS) {
        errorLog.pop();
    }

    // Console log with styling
    const styles = {
        low: 'color: #3b82f6',
        medium: 'color: #f59e0b',
        high: 'color: #ef4444',
        critical: 'color: #dc2626; font-weight: bold',
    };

    console.group(`%c[${error.severity.toUpperCase()}] ${error.code || 'ERROR'}`, styles[error.severity]);
    console.error(error.message);
    if (error.stack) {
        console.error(error.stack);
    }
    if (error.context) {
        console.error('Context:', error.context);
    }
    console.groupEnd();
}

/**
 * Report error to external service (Sentry, LogRocket, etc.)
 */
export async function reportError(error: AppError): Promise<void> {
    // Skip in development
    if (process.env.NODE_ENV === 'development') {
        return;
    }

    const report: ErrorReport = {
        error,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        url: typeof window !== 'undefined' ? window.location.href : 'unknown',
    };

    try {
        // In production, send to error tracking service
        // await fetch('/api/errors', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(report),
        // });

        console.debug('[ErrorReporter] Error reported:', report.error.id);
    } catch (e) {
        console.error('[ErrorReporter] Failed to report error:', e);
    }
}

/**
 * Combined log and report
 */
export function handleError(
    error: Error | string,
    options: {
        code?: string;
        context?: Record<string, unknown>;
        severity?: AppError['severity'];
        report?: boolean;
    } = {}
): AppError {
    const { report = true, ...errorOptions } = options;
    const appError = createAppError(error, errorOptions);

    logError(appError);

    if (report && appError.severity !== 'low') {
        reportError(appError);
    }

    return appError;
}

/**
 * Get recent errors from log
 */
export function getRecentErrors(count = 10): AppError[] {
    return errorLog.slice(0, count);
}

/**
 * Clear error log
 */
export function clearErrorLog(): void {
    errorLog.length = 0;
}

// ============================================================
// User-Friendly Error Messages
// ============================================================

const errorMessages: Record<string, string> = {
    NETWORK_ERROR: 'Bağlantı hatası oluştu. İnternet bağlantınızı kontrol edin.',
    AUTH_ERROR: 'Oturum süreniz doldu. Lütfen tekrar giriş yapın.',
    VALIDATION_ERROR: 'Lütfen girdiğiniz bilgileri kontrol edin.',
    NOT_FOUND: 'Aradığınız sayfa bulunamadı.',
    PERMISSION_DENIED: 'Bu işlem için yetkiniz bulunmuyor.',
    SERVER_ERROR: 'Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.',
    RATE_LIMITED: 'Çok fazla istek gönderdiniz. Lütfen bekleyin.',
    UNKNOWN: 'Beklenmeyen bir hata oluştu.',
};

/**
 * Get user-friendly error message
 */
export function getUserFriendlyMessage(code: string | undefined): string {
    if (!code) return errorMessages.UNKNOWN;
    return errorMessages[code] || errorMessages.UNKNOWN;
}

// ============================================================
// React Hook
// ============================================================

import { useState, useCallback } from 'react';

interface UseErrorHandlerResult {
    error: AppError | null;
    handleError: (error: Error | string, options?: Parameters<typeof handleError>[1]) => void;
    clearError: () => void;
    isError: boolean;
}

export function useErrorHandler(): UseErrorHandlerResult {
    const [error, setError] = useState<AppError | null>(null);

    const handle = useCallback(
        (err: Error | string, options?: Parameters<typeof handleError>[1]) => {
            const appError = handleError(err, options);
            setError(appError);
        },
        []
    );

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        error,
        handleError: handle,
        clearError,
        isError: error !== null,
    };
}

// ============================================================
// Export
// ============================================================

export default {
    createAppError,
    logError,
    reportError,
    handleError,
    getRecentErrors,
    clearErrorLog,
    getUserFriendlyMessage,
    useErrorHandler,
};
