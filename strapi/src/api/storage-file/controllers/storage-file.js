'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::storage-file.storage-file', ({ strapi }) => ({
    // List files for current user
    async findMine(ctx) {
        const userId = ctx.state.user?.id;
        if (!userId) {
            return ctx.unauthorized('Giriş yapmanız gerekiyor');
        }

        const { path = '/' } = ctx.query;

        const files = await strapi.entityService.findMany('api::storage-file.storage-file', {
            filters: {
                owner: userId,
                path: { $startsWith: path },
            },
            populate: ['parent', 'children'],
            sort: { isDirectory: 'desc', name: 'asc' },
        });

        return { success: true, data: files };
    },

    // Create folder
    async createFolder(ctx) {
        const userId = ctx.state.user?.id;
        if (!userId) {
            return ctx.unauthorized('Giriş yapmanız gerekiyor');
        }

        const { name, parentId } = ctx.request.body;

        let parentPath = '/';
        if (parentId) {
            const parent = await strapi.entityService.findOne('api::storage-file.storage-file', parentId);
            if (parent) {
                parentPath = parent.path + parent.name + '/';
            }
        }

        const folder = await strapi.entityService.create('api::storage-file.storage-file', {
            data: {
                name,
                path: parentPath,
                isDirectory: true,
                owner: userId,
                parent: parentId || null,
                storageBackend: 'local',
            },
        });

        return { success: true, data: folder };
    },

    // Lock file for editing
    async lock(ctx) {
        const userId = ctx.state.user?.id;
        const { id } = ctx.params;

        const file = await strapi.entityService.findOne('api::storage-file.storage-file', id);

        if (file.locked && file.lockedBy !== userId) {
            const lockAge = Date.now() - new Date(file.lockedAt).getTime();
            if (lockAge < 30 * 60 * 1000) {
                return ctx.forbidden('Dosya başka bir kullanıcı tarafından kilitli');
            }
        }

        const updated = await strapi.entityService.update('api::storage-file.storage-file', id, {
            data: {
                locked: true,
                lockedBy: userId,
                lockedAt: new Date(),
            },
        });

        return { success: true, data: updated };
    },

    // Unlock file
    async unlock(ctx) {
        const userId = ctx.state.user?.id;
        const { id } = ctx.params;

        const file = await strapi.entityService.findOne('api::storage-file.storage-file', id);

        if (file.lockedBy !== userId) {
            return ctx.forbidden('Dosyayı sadece kilitleyen kullanıcı açabilir');
        }

        const updated = await strapi.entityService.update('api::storage-file.storage-file', id, {
            data: {
                locked: false,
                lockedBy: null,
                lockedAt: null,
            },
        });

        return { success: true, data: updated };
    },
}));
