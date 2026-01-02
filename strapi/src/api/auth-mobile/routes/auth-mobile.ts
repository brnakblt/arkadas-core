/**
 * Mobile Auth Routes
 */

export default {
    routes: [
        {
            method: 'POST',
            path: '/auth/mobile/login',
            handler: 'auth-mobile.login',
            config: {
                auth: false,
                policies: [],
            },
        },
        {
            method: 'POST',
            path: '/auth/mobile/refresh',
            handler: 'auth-mobile.refresh',
            config: {
                auth: false,
                policies: [],
            },
        },
        {
            method: 'POST',
            path: '/auth/mobile/logout',
            handler: 'auth-mobile.logout',
            config: {
                auth: false,
                policies: [],
            },
        },
        {
            method: 'GET',
            path: '/auth/mobile/me',
            handler: 'auth-mobile.me',
            config: {
                policies: ['is-authenticated'],
            },
        },
    ],
};
