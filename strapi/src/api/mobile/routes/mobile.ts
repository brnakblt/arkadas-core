/**
 * Mobile API Routes
 */

export default {
    routes: [
        {
            method: 'GET',
            path: '/mobile/today',
            handler: 'mobile.today',
            config: {
                policies: ['is-authenticated'],
                middlewares: [],
            },
        },
        {
            method: 'GET',
            path: '/mobile/schedule/:date',
            handler: 'mobile.schedule',
            config: {
                policies: ['is-authenticated'],
                middlewares: [],
            },
        },
        {
            method: 'POST',
            path: '/mobile/checkin',
            handler: 'mobile.checkin',
            config: {
                policies: ['is-authenticated'],
                middlewares: [],
            },
        },
        {
            method: 'GET',
            path: '/mobile/attendance',
            handler: 'mobile.attendance',
            config: {
                policies: ['is-authenticated'],
                middlewares: [],
            },
        },
        {
            method: 'GET',
            path: '/mobile/my-students',
            handler: 'mobile.myStudents',
            config: {
                policies: ['is-authenticated'],
                middlewares: [],
            },
        },
    ],
};
