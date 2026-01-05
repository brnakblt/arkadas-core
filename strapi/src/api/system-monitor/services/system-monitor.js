'use strict';

const si = require('systeminformation');

/**
 * system-monitor service
 */

module.exports = ({ strapi }) => ({
    getStats: async () => {
        const [cpu, mem, disk, currentLoad] = await Promise.all([
            si.cpu(),
            si.mem(),
            si.fsSize(),
            si.currentLoad()
        ]);

        return {
            cpu: {
                manufacturer: cpu.manufacturer,
                brand: cpu.brand,
                cores: cpu.cores,
                load: currentLoad.currentLoad.toFixed(2)
            },
            memory: {
                total: mem.total,
                free: mem.free,
                used: mem.used,
                active: mem.active,
                available: mem.available
            },
            disk: disk.map(d => ({
                fs: d.fs,
                type: d.type,
                size: d.size,
                used: d.used,
                use: d.use,
                mount: d.mount
            })),
            timestamp: new Date().toISOString()
        };
    },

    getHealth: async () => {
        const health = {
            database: 'unknown',
            redis: 'unknown', // Strapi doesn't expose redis client directly always, checking if possible
            uptime: process.uptime(),
            timestamp: new Date().toISOString()
        };

        // Check Database (Postgres)
        try {
            await strapi.db.connection.raw('SELECT 1');
            health.database = 'connected';
        } catch (e) {
            health.database = 'disconnected';
        }

        // Check Redis (if configured via plugin or globally accessible)
        // Assuming standard strapi-plugin-redis or strapi built-in cache uses ioredis
        // For now, we will perform a basic check if possible, or just skip
        // If we installed ioredis in strapi root, we could use that.

        return health;
    }
});
