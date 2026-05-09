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

    // Upload file to storage
    async upload(ctx) {
        const userId = ctx.state.user?.id;
        if (!userId) {
            return ctx.unauthorized('Giriş yapmanız gerekiyor');
        }

        const { files } = ctx.request;
        const { path: targetPath = '/', parentId } = ctx.request.body;

        if (!files || !files.file) {
            return ctx.badRequest('Dosya gerekli');
        }

        const file = files.file;
        const vfs = strapi.service('api::storage-file.vfs');

        // Read file content
        const fs = require('fs');
        const content = fs.readFileSync(file.path);

        // Store using WebDAV backend (SFTPGo)
        const storagePath = await vfs.write({
            name: file.name,
            mimeType: file.type,
        }, content, 'webdav');

        // Create database entry
        const storageFile = await strapi.entityService.create('api::storage-file.storage-file', {
            data: {
                name: file.name,
                path: targetPath,
                size: file.size,
                mimeType: file.type,
                storageBackend: 'webdav',
                storagePath,
                owner: userId,
                parent: parentId || null,
                isDirectory: false,
            },
        });

        return { success: true, data: storageFile };
    },

    // Download file from storage
    async download(ctx) {
        const userId = ctx.state.user?.id;
        if (!userId) {
            return ctx.unauthorized('Giriş yapmanız gerekiyor');
        }

        const { id } = ctx.params;
        const file = await strapi.entityService.findOne('api::storage-file.storage-file', id);

        if (!file) {
            return ctx.notFound('Dosya bulunamadı');
        }

        // Check ownership or shared access
        if (file.owner !== userId) {
            return ctx.forbidden('Bu dosyaya erişim izniniz yok');
        }

        const vfs = strapi.service('api::storage-file.vfs');
        const content = await vfs.read(file);

        ctx.set('Content-Type', file.mimeType || 'application/octet-stream');
        ctx.set('Content-Disposition', `attachment; filename="${file.name}"`);
        ctx.body = content;
    },

    // List files in directory (Nextcloud WebDAV)
    async listDirectory(ctx) {
        const userId = ctx.state.user?.id;
        if (!userId) {
            return ctx.unauthorized('Giriş yapmanız gerekiyor');
        }

        const { path: dirPath = '/' } = ctx.query;
        const nextcloudUrl = process.env.NEXTCLOUD_URL || 'http://localhost:8088';
        const adminUser = process.env.NEXTCLOUD_ADMIN_USER || 'admin';
        const adminPass = process.env.NEXTCLOUD_ADMIN_PASSWORD;
        const webdavUrl = `${nextcloudUrl}/remote.php/dav/files/${adminUser}`;

        try {
            // PROPFIND request for WebDAV directory listing
            const response = await fetch(`${webdavUrl}${dirPath}`, {
                method: 'PROPFIND',
                headers: {
                    'Authorization': 'Basic ' + Buffer.from(`${adminUser}:${adminPass}`).toString('base64'),
                    'Depth': '1',
                },
            });

            if (!response.ok) {
                return ctx.badRequest('Dizin listelenemedi');
            }

            const xml = await response.text();
            // Parse WebDAV XML response (simplified)
            const files = this.parseWebDAVResponse(xml, dirPath);
            return { success: true, data: files };
        } catch (error) {
            strapi.log.error('WebDAV list error:', error);
            return ctx.internalServerError('Depolama hatası');
        }
    },

    // Helper to parse WebDAV XML response
    parseWebDAVResponse(xml, basePath) {
        const files = [];
        const hrefMatches = xml.matchAll(/<d:href>([^<]+)<\/d:href>/g);
        const contentLengthMatches = xml.matchAll(/<d:getcontentlength>(\d+)<\/d:getcontentlength>/g);
        const isCollectionMatches = xml.matchAll(/<d:collection\s*\/>/g);

        const hrefs = [...hrefMatches].map(m => decodeURIComponent(m[1]));
        const sizes = [...contentLengthMatches].map(m => parseInt(m[1]));

        hrefs.forEach((href, index) => {
            if (href === basePath) return; // Skip self
            const name = href.split('/').filter(Boolean).pop();
            files.push({
                filename: href,
                basename: name,
                size: sizes[index] || 0,
                type: href.endsWith('/') ? 'directory' : 'file',
            });
        });

        return files;
    },
}));
