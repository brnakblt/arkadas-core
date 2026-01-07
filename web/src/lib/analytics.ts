/* eslint-disable no-console */
/**
 * Privacy-First Analytics Utility
 * 
 * Focuses on essential metrics without tracking personally identifiable information (PII).
 * - No IP tracking
 * - No fingerprinting
 * - No cross-site tracking
 * - Session IDs are random, not linked to user identity
 * 
 * Features:
 * - Page views
 * - Custom events (e.g., "Export PDF", "Bulk Update")
 * - Role-based usage stats (aggregate)
 * - Session tracking (anonymous)
 * - Feature usage tracking
 * - Batch event sending
 */

// ============================================================
// Types
// ============================================================

export interface AnalyticsEvent {
    name: string;
    properties?: Record<string, string | number | boolean>;
    timestamp?: number;
    sessionId?: string;
}

export interface SessionInfo {
    sessionId: string;
    startTime: number;
    pageCount: number;
    eventCount: number;
}

export interface FeatureUsage {
    feature: string;
    count: number;
    lastUsed: number;
}

export interface AggregateStats {
    totalSessions: number;
    totalPageViews: number;
    totalEvents: number;
    featureUsage: Record<string, number>;
    roleUsage: Record<string, number>;
}

// ============================================================
// Configuration
// ============================================================

const ANALYTICS_ENDPOINT = '/api/analytics/collect';
const SESSION_KEY = 'arkadas_session';
const STATS_KEY = 'arkadas_stats';
const BATCH_SIZE = 10;
const BATCH_INTERVAL_MS = 30000; // 30 seconds

// ============================================================
// State
// ============================================================

let currentSession: SessionInfo | null = null;
const eventBuffer: AnalyticsEvent[] = [];
let batchTimeout: ReturnType<typeof setTimeout> | null = null;

// ============================================================
// Session Management
// ============================================================

/**
 * Generate a random session ID (no PII)
 */
function generateSessionId(): string {
    return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Get or create a session
 */
export function getSession(): SessionInfo {
    if (currentSession) {
        return currentSession;
    }

    // Try to restore session from storage (only for tab refreshes)
    if (typeof sessionStorage !== 'undefined') {
        try {
            const stored = sessionStorage.getItem(SESSION_KEY);
            if (stored) {
                currentSession = JSON.parse(stored);
                if (currentSession) return currentSession;
            }
        } catch {
            // Storage not available
        }
    }

    // Create new session
    currentSession = {
        sessionId: generateSessionId(),
        startTime: Date.now(),
        pageCount: 0,
        eventCount: 0,
    };

    persistSession();
    return currentSession;
}

/**
 * Persist session to storage
 */
function persistSession(): void {
    if (typeof sessionStorage !== 'undefined' && currentSession) {
        try {
            sessionStorage.setItem(SESSION_KEY, JSON.stringify(currentSession));
        } catch {
            // Storage not available
        }
    }
}

/**
 * End the current session
 */
export function endSession(): void {
    if (currentSession) {
        // Flush any pending events
        flushEvents();

        // Record session end
        sendEvent({
            name: 'session_end',
            properties: {
                duration_ms: Date.now() - currentSession.startTime,
                page_count: currentSession.pageCount,
                event_count: currentSession.eventCount,
            },
        });

        currentSession = null;
        if (typeof sessionStorage !== 'undefined') {
            sessionStorage.removeItem(SESSION_KEY);
        }
    }
}

// ============================================================
// Event Tracking
// ============================================================

/**
 * Check if Do Not Track is enabled
 */
function isDNTEnabled(): boolean {
    if (typeof navigator !== 'undefined') {
        return navigator.doNotTrack === '1';
    }
    return false;
}

/**
 * Track a page view
 */
export function trackPageView(path: string): void {
    if (isDNTEnabled()) return;

    const session = getSession();
    session.pageCount++;
    persistSession();

    queueEvent({
        name: 'page_view',
        properties: {
            path,
            title: typeof document !== 'undefined' ? document.title : '',
        },
    });
}

/**
 * Track a custom event
 */
export function trackEvent(
    name: string,
    properties?: Record<string, string | number | boolean>
): void {
    if (isDNTEnabled()) return;

    const session = getSession();
    session.eventCount++;
    persistSession();

    queueEvent({ name, properties });
}

/**
 * Track feature usage (for adoption metrics)
 */
export function trackFeatureUsage(feature: string): void {
    if (isDNTEnabled()) return;

    trackEvent('feature_used', { feature });
    updateLocalStats(feature);
}

/**
 * Track role-based action (aggregate only)
 */
export function trackRoleAction(role: string, action: string): void {
    if (isDNTEnabled()) return;

    trackEvent('role_action', {
        role: role.toLowerCase(), // Normalize role names
        action,
    });
}

// ============================================================
// Batching & Sending
// ============================================================

/**
 * Queue an event for batch sending
 */
function queueEvent(event: AnalyticsEvent): void {
    const session = getSession();

    const fullEvent: AnalyticsEvent = {
        ...event,
        timestamp: Date.now(),
        sessionId: session.sessionId,
    };

    eventBuffer.push(fullEvent);

    // Log in development
    if (process.env.NODE_ENV === 'development') {
        console.debug('[Analytics] 📊', fullEvent);
    }

    // Send if buffer is full
    if (eventBuffer.length >= BATCH_SIZE) {
        flushEvents();
    } else if (!batchTimeout) {
        // Schedule batch send
        batchTimeout = setTimeout(flushEvents, BATCH_INTERVAL_MS);
    }
}

/**
 * Flush queued events to server
 */
export async function flushEvents(): Promise<void> {
    if (batchTimeout) {
        clearTimeout(batchTimeout);
        batchTimeout = null;
    }

    if (eventBuffer.length === 0) return;

    const events = [...eventBuffer];
    eventBuffer.length = 0;

    // Skip sending in development
    if (process.env.NODE_ENV === 'development') {
        console.debug('[Analytics] Batch would send:', events.length, 'events');
        return;
    }

    try {
        await fetch(ANALYTICS_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ events }),
            keepalive: true,
        });
    } catch {
        // Re-queue events on failure (silent fail)
        eventBuffer.unshift(...events);
    }
}

/**
 * Legacy send function for direct sending
 */
async function sendEvent(event: AnalyticsEvent): Promise<void> {
    queueEvent(event);
    await flushEvents();
}

// ============================================================
// Local Aggregate Stats
// ============================================================

/**
 * Update local feature usage stats
 */
function updateLocalStats(feature: string): void {
    if (typeof localStorage === 'undefined') return;

    try {
        const stats = getLocalStats();
        stats.featureUsage[feature] = (stats.featureUsage[feature] || 0) + 1;
        stats.totalEvents++;
        localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    } catch {
        // Storage not available
    }
}

/**
 * Get local aggregate stats
 */
export function getLocalStats(): AggregateStats {
    if (typeof localStorage === 'undefined') {
        return {
            totalSessions: 0,
            totalPageViews: 0,
            totalEvents: 0,
            featureUsage: {},
            roleUsage: {},
        };
    }

    try {
        const stored = localStorage.getItem(STATS_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch {
        // Storage not available
    }

    return {
        totalSessions: 0,
        totalPageViews: 0,
        totalEvents: 0,
        featureUsage: {},
        roleUsage: {},
    };
}

/**
 * Clear local stats
 */
export function clearLocalStats(): void {
    if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(STATS_KEY);
    }
}

// ============================================================
// Lifecycle Integration
// ============================================================

/**
 * Initialize analytics (call on app startup)
 */
export function initAnalytics(): void {
    if (typeof window === 'undefined') return;

    // Start session
    const session = getSession();

    // Update session count
    if (typeof localStorage !== 'undefined') {
        try {
            const stats = getLocalStats();
            stats.totalSessions++;
            localStorage.setItem(STATS_KEY, JSON.stringify(stats));
        } catch {
            // Storage not available
        }
    }

    // Track session start
    trackEvent('session_start', {
        is_new: session.pageCount === 0,
    });

    // Flush on page unload
    window.addEventListener('beforeunload', () => {
        flushEvents();
    });

    // End session on page hide (mobile)
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            flushEvents();
        }
    });
}

// ============================================================
// Export
// ============================================================

export const analytics = {
    init: initAnalytics,
    pageView: trackPageView,
    event: trackEvent,
    feature: trackFeatureUsage,
    roleAction: trackRoleAction,
    flush: flushEvents,
    getSession,
    endSession,
    getStats: getLocalStats,
    clearStats: clearLocalStats,
};

export default analytics;
