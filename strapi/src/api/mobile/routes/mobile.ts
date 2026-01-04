/**
 * Mobile API Routes
 * All routes require authentication (handled by controller)
 */

export default {
    routes: [
        {
            method: 'GET',
            path: '/mobile/today',
            handler: 'mobile.today',
            config: {
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'GET',
            path: '/mobile/schedule/:date',
            handler: 'mobile.schedule',
            config: {
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'POST',
            path: '/mobile/checkin',
            handler: 'mobile.checkin',
            config: {
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'GET',
            path: '/mobile/attendance',
            handler: 'mobile.attendance',
            config: {
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'GET',
            path: '/mobile/my-students',
            handler: 'mobile.myStudents',
            config: {
                policies: [],
                middlewares: [],
            },
        },
    ],
};
