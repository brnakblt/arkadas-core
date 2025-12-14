'use strict';

const { createCoreController } = require('@strapi/strapi').factories;
const crypto = require('crypto');

module.exports = createCoreController('api::file-share.file-share', ({ strapi }) => ({
    // Create a public share link
    async createLink(ctx) {
        const userId = ctx.state.user?.id;
        if (!userId) {
            return ctx.unauthorized('Giriş yapmanız gerekiyor');
        }

        const { fileId, permissions, expiresAt, password } = ctx.request.body;

        // Verify user owns the file
        const file = await strapi.entityService.findOne('api::storage-file.storage-file', fileId, {
            populate: ['owner'],
        });

        if (!file || file.owner?.id !== userId) {
            return ctx.forbidden('Bu dosyayı paylaşma yetkiniz yok');
        }

        const token = crypto.randomBytes(32).toString('hex');

        const share = await strapi.entityService.create('api::file-share.file-share', {
            data: {
                file: fileId,
                sharedBy: userId,
                shareType: 'link',
                permissions: permissions || 'read',
                token,
                password: password ? await strapi.service('api::file-share.file-share').hashPassword(password) : null,
                expiresAt: expiresAt || null,
            },
        });

        return {
            success: true,
            data: {
                ...share,
                shareUrl: `${process.env.FRONTEND_URL}/share/${token}`,
            },
        };
    },

    // Access shared file by token
    async accessByToken(ctx) {
        const { token } = ctx.params;
        const { password } = ctx.query;

        const share = await strapi.entityService.findMany('api::file-share.file-share', {
            filters: { token },
            populate: ['file', 'file.owner'],
            limit: 1,
        });

        if (!share.length) {
            return ctx.notFound('Paylaşım bulunamadı');
        }

        const shareData = share[0];

        // Check expiry
        if (shareData.expiresAt && new Date(shareData.expiresAt) < new Date()) {
            return ctx.gone('Paylaşım süresi dolmuş');
        }

        // Check password
        if (shareData.password) {
            const isValid = await strapi.service('api::file-share.file-share').verifyPassword(password, shareData.password);
            if (!isValid) {
                return ctx.unauthorized('Geçersiz şifre');
            }
        }

        // Increment download count
        await strapi.entityService.update('api::file-share.file-share', shareData.id, {
            data: { downloadCount: (shareData.downloadCount || 0) + 1 },
        });

        return { success: true, data: shareData.file, permissions: shareData.permissions };
    },

    // List shares for current user
    async myShares(ctx) {
        const userId = ctx.state.user?.id;
        if (!userId) {
            return ctx.unauthorized('Giriş yapmanız gerekiyor');
        }

        const shares = await strapi.entityService.findMany('api::file-share.file-share', {
            filters: { sharedBy: userId },
            populate: ['file'],
            sort: { createdAt: 'desc' },
        });

        return { success: true, data: shares };
    },

    // Delete share
    async deleteShare(ctx) {
        const userId = ctx.state.user?.id;
        const { id } = ctx.params;

        const share = await strapi.entityService.findOne('api::file-share.file-share', id, {
            populate: ['sharedBy'],
        });

        if (!share || share.sharedBy?.id !== userId) {
            return ctx.forbidden('Bu paylaşımı silme yetkiniz yok');
        }

        await strapi.entityService.delete('api::file-share.file-share', id);

        return { success: true };
    },
}));
