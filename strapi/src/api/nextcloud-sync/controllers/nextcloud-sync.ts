/**
 * nextcloud-sync controller
 * Custom endpoints for user provisioning and sync operations
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::nextcloud-sync.nextcloud-sync', ({ strapi }) => ({
    // Include default CRUD methods
    ...factories.createCoreController('api::nextcloud-sync.nextcloud-sync'),

    /**
     * POST /api/nextcloud-syncs/provision/:userId
     * Provision a Strapi user to Nextcloud
     */
    async provision(ctx) {
        const { userId } = ctx.params;
        const { groups, quotaBytes } = ctx.request.body || {};

        if (!userId) {
            return ctx.badRequest('User ID is required');
        }

        const result = await strapi.service('api::nextcloud-sync.nextcloud-sync').provisionUser(
            parseInt(userId, 10),
            { groups, quotaBytes }
        );

        if (result.success) {
            return ctx.send({
                data: {
                    nextcloudUserId: result.nextcloudUserId,
                    homeFolderPath: result.homeFolderPath,
                },
                meta: { message: 'User provisioned successfully' },
            });
        } else {
            return ctx.badRequest(result.error || 'Provisioning failed');
        }
    },

    /**
     * POST /api/nextcloud-syncs/sync/:userId
     * Sync user data from Nextcloud
     */
    async sync(ctx) {
        const { userId } = ctx.params;

        if (!userId) {
            return ctx.badRequest('User ID is required');
        }

        const result = await strapi.service('api::nextcloud-sync.nextcloud-sync').syncUserData(
            parseInt(userId, 10)
        );

        if (result.success) {
            return ctx.send({
                data: { nextcloudUserId: result.nextcloudUserId },
                meta: { message: 'Sync completed successfully' },
            });
        } else {
            return ctx.badRequest(result.error || 'Sync failed');
        }
    },

    /**
     * POST /api/nextcloud-syncs/suspend/:userId
     * Suspend user in Nextcloud
     */
    async suspend(ctx) {
        const { userId } = ctx.params;

        if (!userId) {
            return ctx.badRequest('User ID is required');
        }

        const result = await strapi.service('api::nextcloud-sync.nextcloud-sync').suspendUser(
            parseInt(userId, 10)
        );

        if (result.success) {
            return ctx.send({
                data: { nextcloudUserId: result.nextcloudUserId },
                meta: { message: 'User suspended successfully' },
            });
        } else {
            return ctx.badRequest(result.error || 'Suspend failed');
        }
    },

    /**
     * POST /api/nextcloud-syncs/reactivate/:userId
     * Reactivate user in Nextcloud
     */
    async reactivate(ctx) {
        const { userId } = ctx.params;

        if (!userId) {
            return ctx.badRequest('User ID is required');
        }

        const result = await strapi.service('api::nextcloud-sync.nextcloud-sync').reactivateUser(
            parseInt(userId, 10)
        );

        if (result.success) {
            return ctx.send({
                data: { nextcloudUserId: result.nextcloudUserId },
                meta: { message: 'User reactivated successfully' },
            });
        } else {
            return ctx.badRequest(result.error || 'Reactivate failed');
        }
    },

    /**
     * GET /api/nextcloud-syncs/status/:userId
     * Get sync status for a user
     */
    async status(ctx) {
        const { userId } = ctx.params;

        if (!userId) {
            return ctx.badRequest('User ID is required');
        }

        const syncRecord = await strapi.service('api::nextcloud-sync.nextcloud-sync').getSyncStatus(
            parseInt(userId, 10)
        );

        if (syncRecord) {
            return ctx.send({ data: syncRecord });
        } else {
            return ctx.notFound('Sync record not found');
        }
    },

    /**
     * POST /api/nextcloud-syncs/batch-provision
     * Batch provision multiple users
     */
    async batchProvision(ctx) {
        const { userIds, groups, quotaBytes } = ctx.request.body || {};

        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return ctx.badRequest('userIds array is required');
        }

        const result = await strapi.service('api::nextcloud-sync.nextcloud-sync').batchProvision(
            userIds.map((id: string | number) => parseInt(id.toString(), 10)),
            { groups, quotaBytes }
        );

        return ctx.send({
            data: {
                successful: result.successful,
                failed: result.failed,
                results: result.results,
            },
            meta: { message: `Provisioned ${result.successful} users, ${result.failed} failed` },
        });
    },
}));
