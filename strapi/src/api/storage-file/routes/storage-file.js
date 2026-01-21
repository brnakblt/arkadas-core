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
        {
            method: 'POST',
            path: '/storage-files/upload',
            handler: 'storage-file.upload',
            config: {
                policies: [],
            },
        },
        {
            method: 'GET',
            path: '/storage-files/:id/download',
            handler: 'storage-file.download',
            config: {
                policies: [],
            },
        },
        {
            method: 'GET',
            path: '/storage-files/list',
            handler: 'storage-file.listDirectory',
            config: {
                policies: [],
            },
        },
    ],
};
