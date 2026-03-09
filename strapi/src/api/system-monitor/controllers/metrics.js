/**
 * Metrics Controller
 *
 * Exposes Prometheus-format metrics at /api/system-monitor/metrics.
 * This endpoint should be scraped by Prometheus (no auth required for internal network).
 */

const metricsService = require('../services/metrics');

module.exports = {
    async getMetrics(ctx) {
        try {
            const { register, dbPoolActive, dbPoolIdle } = metricsService;

            // Try to update DB pool stats from Knex
            try {
                const knex = strapi.db?.connection;
                if (knex && knex.client && knex.client.pool) {
                    const pool = knex.client.pool;
                    dbPoolActive.set(pool.numUsed?.() ?? 0);
                    dbPoolIdle.set(pool.numFree?.() ?? 0);
                }
            } catch {
                // Pool stats unavailable — non-critical
            }

            ctx.set('Content-Type', register.contentType);
            ctx.body = await register.metrics();
        } catch (err) {
            strapi.log.error('[Metrics] Error generating metrics:', err);
            ctx.status = 500;
            ctx.body = 'Error generating metrics';
        }
    },
};
