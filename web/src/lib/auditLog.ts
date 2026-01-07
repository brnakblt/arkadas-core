'use client';

/**
 * Audit Logging Service
 * Tracks all user actions for security and debugging
 */

type ActionType =
    | 'CREATE'
    | 'READ'
    | 'UPDATE'
    | 'DELETE'
    | 'LOGIN'
    | 'LOGOUT'
    | 'EXPORT'
    | 'IMPORT'
    | 'ERROR';

interface AuditLogEntry {
    id: string;
    timestamp: string;
    userId: string;
    userName: string;
    action: ActionType;
    resource: string;
    resourceId?: string;
    details?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
    status: 'success' | 'failure';
    errorMessage?: string;
}

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

/**
 * Generate unique ID
 */
function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get client info
 */
function getClientInfo() {
    if (typeof window === 'undefined') {
        return { userAgent: 'server', ipAddress: 'server' };
    }

    return {
        userAgent: navigator.userAgent,
        ipAddress: 'client', // IP is typically captured server-side
    };
}

/**
 * Log an action to the audit log
 */
export async function logAction(params: {
    userId: string;
    userName: string;
    action: ActionType;
    resource: string;
    resourceId?: string;
    details?: Record<string, unknown>;
    status?: 'success' | 'failure';
    errorMessage?: string;
}): Promise<void> {
    const clientInfo = getClientInfo();

    const entry: AuditLogEntry = {
        id: generateId(),
        timestamp: new Date().toISOString(),
        userId: params.userId,
        userName: params.userName,
        action: params.action,
        resource: params.resource,
        resourceId: params.resourceId,
        details: params.details,
        status: params.status || 'success',
        errorMessage: params.errorMessage,
        ...clientInfo,
    };

    // Store locally
    storeLocalLog(entry);

    // Send to server (fire and forget)
    try {
        await fetch(`${STRAPI_URL}/api/audit-logs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: entry }),
        });
    } catch (error) {
        console.warn('Failed to send audit log to server:', error);
        // Continue without throwing - audit logs should not break the app
    }
}

/**
 * Store log locally for offline support
 */
function storeLocalLog(entry: AuditLogEntry): void {
    if (typeof window === 'undefined') return;

    try {
        const logs = JSON.parse(localStorage.getItem('auditLogs') || '[]');
        logs.push(entry);

        // Keep only last 1000 entries
        if (logs.length > 1000) {
            logs.shift();
        }

        localStorage.setItem('auditLogs', JSON.stringify(logs));
    } catch {
        // localStorage might be full or disabled
    }
}

/**
 * Get local audit logs
 */
export function getLocalLogs(): AuditLogEntry[] {
    if (typeof window === 'undefined') return [];

    try {
        return JSON.parse(localStorage.getItem('auditLogs') || '[]');
    } catch {
        return [];
    }
}

/**
 * Clear local audit logs
 */
export function clearLocalLogs(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('auditLogs');
}

/**
 * Audit logger helper functions
 */
export const auditLog = {
    // User actions
    login: (userId: string, userName: string, details?: Record<string, unknown>) =>
        logAction({ userId, userName, action: 'LOGIN', resource: 'auth', details }),

    logout: (userId: string, userName: string) =>
        logAction({ userId, userName, action: 'LOGOUT', resource: 'auth' }),

    // CRUD operations
    create: (
        userId: string,
        userName: string,
        resource: string,
        resourceId: string,
        details?: Record<string, unknown>
    ) =>
        logAction({
            userId,
            userName,
            action: 'CREATE',
            resource,
            resourceId,
            details,
        }),

    read: (
        userId: string,
        userName: string,
        resource: string,
        resourceId?: string
    ) =>
        logAction({ userId, userName, action: 'READ', resource, resourceId }),

    update: (
        userId: string,
        userName: string,
        resource: string,
        resourceId: string,
        details?: Record<string, unknown>
    ) =>
        logAction({
            userId,
            userName,
            action: 'UPDATE',
            resource,
            resourceId,
            details,
        }),

    delete: (
        userId: string,
        userName: string,
        resource: string,
        resourceId: string
    ) =>
        logAction({ userId, userName, action: 'DELETE', resource, resourceId }),

    // Export/Import
    export: (
        userId: string,
        userName: string,
        resource: string,
        details?: Record<string, unknown>
    ) =>
        logAction({ userId, userName, action: 'EXPORT', resource, details }),

    import: (
        userId: string,
        userName: string,
        resource: string,
        details?: Record<string, unknown>
    ) =>
        logAction({ userId, userName, action: 'IMPORT', resource, details }),

    // Errors
    error: (
        userId: string,
        userName: string,
        resource: string,
        errorMessage: string,
        details?: Record<string, unknown>
    ) =>
        logAction({
            userId,
            userName,
            action: 'ERROR',
            resource,
            status: 'failure',
            errorMessage,
            details,
        }),
};

/**
 * React hook for audit logging
 */
export function useAuditLog() {
    // This could be connected to an auth context to get user info
    const userId = 'current-user-id'; // Replace with actual user ID
    const userName = 'Current User'; // Replace with actual user name

    return {
        logCreate: (resource: string, resourceId: string, details?: Record<string, unknown>) =>
            auditLog.create(userId, userName, resource, resourceId, details),

        logRead: (resource: string, resourceId?: string) =>
            auditLog.read(userId, userName, resource, resourceId),

        logUpdate: (resource: string, resourceId: string, details?: Record<string, unknown>) =>
            auditLog.update(userId, userName, resource, resourceId, details),

        logDelete: (resource: string, resourceId: string) =>
            auditLog.delete(userId, userName, resource, resourceId),

        logExport: (resource: string, details?: Record<string, unknown>) =>
            auditLog.export(userId, userName, resource, details),

        logError: (resource: string, errorMessage: string, details?: Record<string, unknown>) =>
            auditLog.error(userId, userName, resource, errorMessage, details),
    };
}
