/**
 * Prometheus Metrics Service for Strapi
 *
 * Exposes application-level metrics at /api/system-monitor/metrics
 * for Prometheus scraping:
 *   - HTTP request latency (histogram)
 *   - Permission check cache hit/miss rates (counter)
 *   - Active database connections (gauge)
 */

const client = require('prom-client');

// Create a dedicated registry (avoids polluting the global default)
const register = new client.Registry();

// Default process/Node.js metrics
client.collectDefaultMetrics({ register });

// ============================================================
// Custom Metrics
// ============================================================

/** HTTP request latency histogram */
const httpRequestDuration = new client.Histogram({
    name: 'strapi_http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    registers: [register],
});

/** Total HTTP requests counter */
const httpRequestsTotal = new client.Counter({
    name: 'strapi_http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'status_code'],
    registers: [register],
});

/** Permission check counter (cache hit/miss/denied) */
const permissionChecksTotal = new client.Counter({
    name: 'strapi_permission_checks_total',
    help: 'Total permission checks with result label',
    labelNames: ['result'],
    registers: [register],
});

/** Active DB connections gauge */
const dbPoolActive = new client.Gauge({
    name: 'strapi_db_pool_active_connections',
    help: 'Number of active database pool connections',
    registers: [register],
});

const dbPoolIdle = new client.Gauge({
    name: 'strapi_db_pool_idle_connections',
    help: 'Number of idle database pool connections',
    registers: [register],
});

/** Content entries gauge */
const contentEntries = new client.Gauge({
    name: 'strapi_content_entries_total',
    help: 'Number of entries per content type',
    labelNames: ['content_type'],
    registers: [register],
});

module.exports = {
    register,
    httpRequestDuration,
    httpRequestsTotal,
    permissionChecksTotal,
    dbPoolActive,
    dbPoolIdle,
    contentEntries,
};
