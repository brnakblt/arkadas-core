'use strict';

module.exports = {
    routes: [
        {
            method: 'GET',
            path: '/storage-files/mine',
            handler: 'storage-file.findMine',
            config: {
                policies: [],
            },
        },
        {
            method: 'POST',
            path: '/storage-files/folder',
            handler: 'storage-file.createFolder',
            config: {
                policies: [],
            },
        },
        {
            method: 'POST',
            path: '/storage-files/:id/lock',
            handler: 'storage-file.lock',
            config: {
                policies: [],
            },
        },
        {
            method: 'POST',
            path: '/storage-files/:id/unlock',
            handler: 'storage-file.unlock',
            config: {
                policies: [],
            },
        },
    ],
};
