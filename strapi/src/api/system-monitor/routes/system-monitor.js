module.exports = {
    routes: [
        {
            method: 'GET',
            path: '/system-monitor/stats',
            handler: 'system-monitor.getStats',
            config: {
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'GET',
            path: '/system-monitor/health',
            handler: 'system-monitor.getHealth',
            config: {
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'GET',
            path: '/system-monitor/metrics',
            handler: 'metrics.getMetrics',
            config: {
                policies: [],
                middlewares: [],
            },
        },
    ],
};
