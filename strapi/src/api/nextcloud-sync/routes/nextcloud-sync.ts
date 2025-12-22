/**
 * nextcloud-sync router
 * Custom routes for Nextcloud user provisioning and sync
 */

export default {
    routes: [
        // === Default CRUD routes ===
        {
            method: 'GET',
            path: '/nextcloud-syncs',
            handler: 'nextcloud-sync.find',
            config: {
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'GET',
            path: '/nextcloud-syncs/:id',
            handler: 'nextcloud-sync.findOne',
            config: {
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'POST',
            path: '/nextcloud-syncs',
            handler: 'nextcloud-sync.create',
            config: {
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'PUT',
            path: '/nextcloud-syncs/:id',
            handler: 'nextcloud-sync.update',
            config: {
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'DELETE',
            path: '/nextcloud-syncs/:id',
            handler: 'nextcloud-sync.delete',
            config: {
                policies: [],
                middlewares: [],
            },
        },

        // === Custom provisioning routes ===
        {
            method: 'POST',
            path: '/nextcloud-syncs/provision/:userId',
            handler: 'nextcloud-sync.provision',
            config: {
                policies: [],
                middlewares: [],
                description: 'Provision a Strapi user to Nextcloud',
            },
        },
        {
            method: 'POST',
            path: '/nextcloud-syncs/sync/:userId',
            handler: 'nextcloud-sync.sync',
            config: {
                policies: [],
                middlewares: [],
                description: 'Sync user data from Nextcloud',
            },
        },
        {
            method: 'POST',
            path: '/nextcloud-syncs/suspend/:userId',
            handler: 'nextcloud-sync.suspend',
            config: {
                policies: [],
                middlewares: [],
                description: 'Suspend user in Nextcloud',
            },
        },
        {
            method: 'POST',
            path: '/nextcloud-syncs/reactivate/:userId',
            handler: 'nextcloud-sync.reactivate',
            config: {
                policies: [],
                middlewares: [],
                description: 'Reactivate suspended user in Nextcloud',
            },
        },
        {
            method: 'GET',
            path: '/nextcloud-syncs/status/:userId',
            handler: 'nextcloud-sync.status',
            config: {
                policies: [],
                middlewares: [],
                description: 'Get sync status for a user',
            },
        },
        {
            method: 'POST',
            path: '/nextcloud-syncs/batch-provision',
            handler: 'nextcloud-sync.batchProvision',
            config: {
                policies: [],
                middlewares: [],
                description: 'Batch provision multiple users',
            },
        },
    ],
};
