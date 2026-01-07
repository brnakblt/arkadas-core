/**
 * Monitoring and Error Tracking Utilities
 * 
 * Integrates with Sentry, LogRocket, or custom monitoring.
 * Provides performance metrics, error tracking, and user session recording.
 * 
 * Installation:
 * npm install @sentry/nextjs
 */

// ============================================================
// Types
// ============================================================

export interface MonitoringConfig {
    dsn?: string;
    environment: 'development' | 'staging' | 'production';
    release?: string;
    sampleRate?: number;
    enablePerformance?: boolean;
    enableReplays?: boolean;
}

export interface PerformanceMetric {
    name: string;
    value: number;
    unit: 'ms' | 's' | 'bytes' | 'count';
    timestamp: Date;
    tags?: Record<string, string>;
}

export interface UserContext {
    id?: string;
    email?: string;
    role?: string;
    extra?: Record<string, unknown>;
}

// ============================================================
// Default Configuration
// ============================================================

const defaultConfig: MonitoringConfig = {
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: (process.env.NODE_ENV as MonitoringConfig['environment']) || 'development',
    release: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    sampleRate: 1.0,
    enablePerformance: true,
    enableReplays: false,
};

// ============================================================
// Monitoring State
// ============================================================

let isInitialized = false;
let currentUser: UserContext | null = null;
const metricsBuffer: PerformanceMetric[] = [];
const MAX_METRICS_BUFFER = 100;

// ============================================================
// Initialization
// ============================================================

/**
 * Initialize monitoring (call once at app startup)
 */
export async function initMonitoring(config: Partial<MonitoringConfig> = {}): Promise<void> {
    if (isInitialized) {
        console.warn('[Monitoring] Already initialized');
        return;
    }

    const finalConfig = { ...defaultConfig, ...config };

    if (!finalConfig.dsn) {
        console.warn('[Monitoring] No DSN configured, running in mock mode');
        isInitialized = true;
        return;
    }

    try {
        // Dynamic import Sentry
        const Sentry = await import('@sentry/nextjs');

        Sentry.init({
            dsn: finalConfig.dsn,
            environment: finalConfig.environment,
            release: finalConfig.release,
            tracesSampleRate: finalConfig.enablePerformance ? finalConfig.sampleRate : 0,
            replaysSessionSampleRate: finalConfig.enableReplays ? 0.1 : 0,
            replaysOnErrorSampleRate: finalConfig.enableReplays ? 1.0 : 0,
        });

        console.warn('[Monitoring] Sentry initialized');
        isInitialized = true;
    } catch (error) {
        console.warn('[Monitoring] Sentry not available, running in mock mode:', error);
        isInitialized = true;
    }
}

// ============================================================
// Error Tracking
// ============================================================

/**
 * Capture and report an error
 */
export async function captureError(
    error: Error | string,
    context?: Record<string, unknown>
): Promise<void> {
    const errorObj = typeof error === 'string' ? new Error(error) : error;

    console.error('[Monitoring] Error:', errorObj.message, context);

    try {
        const Sentry = await import('@sentry/nextjs');
        Sentry.captureException(errorObj, {
            extra: context,
        });
    } catch {
        // Sentry not available
    }
}

/**
 * Capture a message (non-error event)
 */
export async function captureMessage(
    message: string,
    level: 'info' | 'warning' | 'error' = 'info',
    context?: Record<string, unknown>
): Promise<void> {
    console.warn(`[Monitoring] ${level.toUpperCase()}: ${message}`, context);

    try {
        const Sentry = await import('@sentry/nextjs');
        Sentry.captureMessage(message, {
            level,
            extra: context,
        });
    } catch {
        // Sentry not available
    }
}

// ============================================================
// User Context
// ============================================================

/**
 * Set the current user for error tracking
 */
export async function setUser(user: UserContext | null): Promise<void> {
    currentUser = user;

    try {
        const Sentry = await import('@sentry/nextjs');
        if (user) {
            Sentry.setUser({
                id: user.id,
                email: user.email,
                username: user.role,
                ...user.extra,
            });
        } else {
            Sentry.setUser(null);
        }
    } catch {
        // Sentry not available
    }
}

/**
 * Get current user context
 */
export function getUser(): UserContext | null {
    return currentUser;
}

// ============================================================
// Performance Monitoring
// ============================================================

/**
 * Track a performance metric
 */
export function trackMetric(metric: Omit<PerformanceMetric, 'timestamp'>): void {
    const fullMetric: PerformanceMetric = {
        ...metric,
        timestamp: new Date(),
    };

    metricsBuffer.push(fullMetric);
    if (metricsBuffer.length > MAX_METRICS_BUFFER) {
        metricsBuffer.shift();
    }

    console.warn(`[Monitoring] Metric: ${metric.name} = ${metric.value}${metric.unit}`);
}

/**
 * Track page load performance
 */
export function trackPageLoad(): void {
    if (typeof window === 'undefined') return;

    const timing = performance.timing;
    const loadTime = timing.loadEventEnd - timing.navigationStart;
    const domReady = timing.domContentLoadedEventEnd - timing.navigationStart;
    const ttfb = timing.responseStart - timing.requestStart;

    trackMetric({ name: 'page_load', value: loadTime, unit: 'ms' });
    trackMetric({ name: 'dom_ready', value: domReady, unit: 'ms' });
    trackMetric({ name: 'ttfb', value: ttfb, unit: 'ms' });
}

/**
 * Track Web Vitals
 */
export function trackWebVitals(): void {
    if (typeof window === 'undefined') return;

    // Use web-vitals library if available
    import('web-vitals')
        .then(({ onCLS, onINP, onLCP, onFCP, onTTFB }) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onCLS((metric: any) => trackMetric({ name: 'CLS', value: metric.value, unit: 'count' }));
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onINP((metric: any) => trackMetric({ name: 'INP', value: metric.value, unit: 'ms' }));
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onLCP((metric: any) => trackMetric({ name: 'LCP', value: metric.value, unit: 'ms' }));
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onFCP((metric: any) => trackMetric({ name: 'FCP', value: metric.value, unit: 'ms' }));
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onTTFB((metric: any) => trackMetric({ name: 'TTFB', value: metric.value, unit: 'ms' }));
        })
        .catch(() => {
            console.warn('[Monitoring] web-vitals not available');
        });
}

/**
 * Create a performance span for measuring operations
 */
export function startSpan(name: string): () => void {
    const startTime = performance.now();

    return () => {
        const duration = performance.now() - startTime;
        trackMetric({ name, value: duration, unit: 'ms' });
    };
}

/**
 * Get recent metrics
 */
export function getMetrics(count = 50): PerformanceMetric[] {
    return metricsBuffer.slice(-count);
}

// ============================================================
// Breadcrumbs (Action Tracking)
// ============================================================

/**
 * Add a breadcrumb for debugging
 */
export async function addBreadcrumb(
    message: string,
    category: string,
    data?: Record<string, unknown>
): Promise<void> {
    console.warn(`[Monitoring] Breadcrumb: [${category}] ${message}`, data);

    try {
        const Sentry = await import('@sentry/nextjs');
        Sentry.addBreadcrumb({
            message,
            category,
            data,
            level: 'info',
        });
    } catch {
        // Sentry not available
    }
}

// ============================================================
// Health Check
// ============================================================

/**
 * Send a health check ping
 */
export async function pingHealthCheck(): Promise<boolean> {
    // In production, ping your health check endpoint
    // await fetch('/api/health');
    return true;
}

// ============================================================
// Export
// ============================================================

export const monitoring = {
    init: initMonitoring,
    captureError,
    captureMessage,
    setUser,
    getUser,
    trackMetric,
    trackPageLoad,
    trackWebVitals,
    startSpan,
    getMetrics,
    addBreadcrumb,
    pingHealthCheck,
};

export default monitoring;
