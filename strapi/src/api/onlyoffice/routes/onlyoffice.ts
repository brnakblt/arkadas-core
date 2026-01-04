/**
 * OnlyOffice API Routes
 */

export default {
    routes: [
        {
            method: 'POST',
            path: '/onlyoffice/callback',
            handler: 'callback.callback',
            config: {
                auth: false, // OnlyOffice server calls this
                policies: [],
            },
        },
        {
            method: 'GET',
            path: '/onlyoffice/lock/:documentId',
            handler: 'callback.getLock',
            config: {
                policies: [],
            },
        },
        {
            method: 'POST',
            path: '/onlyoffice/lock/:documentId',
            handler: 'callback.acquireLock',
            config: {
                policies: [],
            },
        },
        {
            method: 'DELETE',
            path: '/onlyoffice/lock/:documentId',
            handler: 'callback.releaseLock',
            config: {
                policies: [],
            },
        },
    ],
};
