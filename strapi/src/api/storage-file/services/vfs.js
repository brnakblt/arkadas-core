'use strict';

/**
 * Virtual File System Service
 * Abstracts storage backends (local, S3/MinIO, WebDAV/SFTPGo)
 */

const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

// Storage path configuration
const LOCAL_STORAGE_PATH = process.env.LOCAL_STORAGE_PATH || './uploads/storage';

module.exports = {
    /**
     * Write file to storage
     * @param {Object} file - File metadata
     * @param {Buffer} content - File content
     * @param {string} backend - Storage backend (local, s3, nextcloud)
     */
    async write(file, content, backend = 'local') {
        const storagePath = this.generateStoragePath(file);

        if (backend === 'local') {
            const fullPath = path.join(LOCAL_STORAGE_PATH, storagePath);
            await fs.mkdir(path.dirname(fullPath), { recursive: true });
            await fs.writeFile(fullPath, content);
        } else if (backend === 's3') {
            // S3 implementation
            const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
            const s3Client = new S3Client({
                region: process.env.S3_REGION || 'us-east-1',
                endpoint: process.env.S3_ENDPOINT,
                credentials: {
                    accessKeyId: process.env.S3_ACCESS_KEY,
                    secretAccessKey: process.env.S3_SECRET_KEY,
                },
                forcePathStyle: true,
            });

            await s3Client.send(new PutObjectCommand({
                Bucket: process.env.S3_BUCKET,
                Key: storagePath,
                Body: content,
                ContentType: file.mimeType,
            }));
        } else if (backend === 'webdav' || backend === 'nextcloud') {
            // WebDAV implementation (Nextcloud)
            const nextcloudUrl = process.env.NEXTCLOUD_URL || 'http://localhost:8088';
            const adminUser = process.env.NEXTCLOUD_ADMIN_USER || 'admin';
            const adminPass = process.env.NEXTCLOUD_ADMIN_PASSWORD;
            
            // Nextcloud WebDAV root: /remote.php/dav/files/USER/
            const webdavUrl = `${nextcloudUrl}/remote.php/dav/files/${adminUser}`;

            await fetch(`${webdavUrl}/${storagePath}`, {
                method: 'PUT',
                headers: {
                    'Authorization': 'Basic ' + Buffer.from(`${adminUser}:${adminPass}`).toString('base64'),
                    'Content-Type': file.mimeType || 'application/octet-stream',
                },
                body: content,
            });
        }

        return storagePath;
    },

    /**
     * Read file from storage
     * @param {Object} file - File entity with storageBackend and storagePath
     */
    async read(file) {
        if (file.storageBackend === 'local') {
            const fullPath = path.join(LOCAL_STORAGE_PATH, file.storagePath);
            return fs.readFile(fullPath);
        } else if (file.storageBackend === 's3') {
            const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
            const s3Client = this.getS3Client();

            const response = await s3Client.send(new GetObjectCommand({
                Bucket: process.env.S3_BUCKET,
                Key: file.storagePath,
            }));

            return streamToBuffer(response.Body);
        } else if (file.storageBackend === 'webdav' || file.storageBackend === 'nextcloud') {
            const nextcloudUrl = process.env.NEXTCLOUD_URL || 'http://localhost:8088';
            const adminUser = process.env.NEXTCLOUD_ADMIN_USER || 'admin';
            const adminPass = process.env.NEXTCLOUD_ADMIN_PASSWORD;
            const webdavUrl = `${nextcloudUrl}/remote.php/dav/files/${adminUser}`;

            const response = await fetch(`${webdavUrl}/${file.storagePath}`, {
                headers: {
                    'Authorization': 'Basic ' + Buffer.from(`${adminUser}:${adminPass}`).toString('base64'),
                },
            });

            return Buffer.from(await response.arrayBuffer());
        }

        throw new Error(`Unknown storage backend: ${file.storageBackend}`);
    },

    /**
     * Delete file from storage
     */
    async delete(file) {
        if (file.storageBackend === 'local') {
            const fullPath = path.join(LOCAL_STORAGE_PATH, file.storagePath);
            await fs.unlink(fullPath).catch(() => { });
        } else if (file.storageBackend === 's3') {
            const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');
            const s3Client = this.getS3Client();

            await s3Client.send(new DeleteObjectCommand({
                Bucket: process.env.S3_BUCKET,
                Key: file.storagePath,
            }));
        }
    },

    /**
     * Generate unique storage path for file
     */
    generateStoragePath(file) {
        const date = new Date();
        const hash = crypto.randomBytes(8).toString('hex');
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        return `${year}/${month}/${hash}/${file.name}`;
    },

    /**
     * Generate ETag from content
     */
    generateEtag(content) {
        return crypto.createHash('md5').update(content).digest('hex');
    },

    /**
     * Generate checksum from content
     */
    generateChecksum(content) {
        return crypto.createHash('sha256').update(content).digest('hex');
    },

    /**
     * Get S3 client instance
     */
    getS3Client() {
        const { S3Client } = require('@aws-sdk/client-s3');
        return new S3Client({
            region: process.env.S3_REGION || 'us-east-1',
            endpoint: process.env.S3_ENDPOINT,
            credentials: {
                accessKeyId: process.env.S3_ACCESS_KEY,
                secretAccessKey: process.env.S3_SECRET_KEY,
            },
            forcePathStyle: true,
        });
    },

    /**
     * Get file info (size, mime type, etc.)
     */
    async getFileInfo(filePath, backend = 'local') {
        if (backend === 'local') {
            const fullPath = path.join(LOCAL_STORAGE_PATH, filePath);
            const stat = await fs.stat(fullPath);
            return {
                size: stat.size,
                modifiedAt: stat.mtime,
            };
        }
        return null;
    },

    /**
     * Check if file exists
     */
    async exists(storagePath, backend = 'local') {
        if (backend === 'local') {
            const fullPath = path.join(LOCAL_STORAGE_PATH, storagePath);
            try {
                await fs.access(fullPath);
                return true;
            } catch {
                return false;
            }
        }
        return false;
    },
};

/**
 * Convert stream to buffer
 */
async function streamToBuffer(stream) {
    const chunks = [];
    for await (const chunk of stream) {
        chunks.push(chunk);
    }
    return Buffer.concat(chunks);
}
