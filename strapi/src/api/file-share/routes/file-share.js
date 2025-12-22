'use strict';

module.exports = {
    routes: [
        {
            method: 'POST',
            path: '/file-shares/link',
            handler: 'file-share.createLink',
            config: {
                policies: [],
            },
        },
        {
            method: 'GET',
            path: '/file-shares/token/:token',
            handler: 'file-share.accessByToken',
            config: {
                auth: false, // Public access
            },
        },
        {
            method: 'GET',
            path: '/file-shares/mine',
            handler: 'file-share.myShares',
            config: {
                policies: [],
            },
        },
        {
            method: 'DELETE',
            path: '/file-shares/:id',
            handler: 'file-share.deleteShare',
            config: {
                policies: [],
            },
        },
    ],
};
