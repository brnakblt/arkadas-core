module.exports = {
    routes: [
        {
            method: 'GET',
            path: '/consistency-check',
            handler: 'consistency-check.check',
            config: {
                policies: [],
                middlewares: [],
            },
        },
    ],
};
