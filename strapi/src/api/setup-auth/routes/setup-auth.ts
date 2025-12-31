export default {
    routes: [
        {
            method: 'POST',
            path: '/auth/reset-initial-password',
            handler: 'setup-auth.resetInitialPassword',
            config: {
                auth: false, // Public endpoint, verifies identity via TCKN
                policies: [],
                middlewares: [],
            },
        },
    ],
};
