/**
 * Nextcloud WebDAV Client Utility
 * Provides file operations through Nextcloud's WebDAV API
 */

import { createClient, WebDAVClient, FileStat } from 'webdav';

const NEXTCLOUD_URL = process.env.NEXTCLOUD_URL || 'http://localhost:8080';
const NEXTCLOUD_ADMIN_USER = process.env.NEXTCLOUD_ADMIN_USER || 'admin';
const NEXTCLOUD_ADMIN_PASSWORD = process.env.NEXTCLOUD_ADMIN_PASSWORD || '';

export interface NextcloudFile {
    filename: string;
    basename: string;
    type: 'file' | 'directory';
    size: number;
    lastmod: string;
    mime?: string;
    etag?: string;
}

export interface UploadOptions {
    overwrite?: boolean;
    contentType?: string;
}

/**
 * Create a Nextcloud WebDAV client for a specific user
 */
export const createNextcloudClient = (username?: string, password?: string): WebDAVClient => {
    const user = username || NEXTCLOUD_ADMIN_USER;
    const pass = password || NEXTCLOUD_ADMIN_PASSWORD;

    return createClient(`${NEXTCLOUD_URL}/remote.php/dav/files/${user}`, {
        username: user,
        password: pass,
    });
};

/**
 * Create admin client for system operations
 */
export const getAdminClient = (): WebDAVClient => {
    return createClient(`${NEXTCLOUD_URL}/remote.php/dav/files/${NEXTCLOUD_ADMIN_USER}`, {
        username: NEXTCLOUD_ADMIN_USER,
        password: NEXTCLOUD_ADMIN_PASSWORD,
    });
};

/**
 * List files in a directory
 */
export const listFiles = async (
    client: WebDAVClient,
    path: string = '/'
): Promise<NextcloudFile[]> => {
    try {
        const contents = await client.getDirectoryContents(path) as FileStat[];

        return contents.map((item) => ({
            filename: item.filename,
            basename: item.basename,
            type: item.type as 'file' | 'directory',
            size: item.size,
            lastmod: item.lastmod,
            mime: item.mime,
            etag: item.etag ?? undefined,
        }));
    } catch (error) {
        console.error('Error listing files:', error);
        throw new Error('Failed to list files from Nextcloud');
    }
};

/**
 * Upload a file to Nextcloud
 */
export const uploadFile = async (
    client: WebDAVClient,
    remotePath: string,
    content: Buffer | ArrayBuffer | string,
    options: UploadOptions = {}
): Promise<boolean> => {
    try {
        await client.putFileContents(remotePath, content, {
            overwrite: options.overwrite ?? true,
            contentLength: content instanceof Buffer ? content.length : undefined,
        });
        return true;
    } catch (error) {
        console.error('Error uploading file:', error);
        throw new Error('Failed to upload file to Nextcloud');
    }
};

/**
 * Download a file from Nextcloud
 */
export const downloadFile = async (
    client: WebDAVClient,
    remotePath: string
): Promise<Buffer> => {
    try {
        const content = await client.getFileContents(remotePath) as Buffer;
        return content;
    } catch (error) {
        console.error('Error downloading file:', error);
        throw new Error('Failed to download file from Nextcloud');
    }
};

/**
 * Delete a file or directory
 */
export const deleteFile = async (
    client: WebDAVClient,
    remotePath: string
): Promise<boolean> => {
    try {
        await client.deleteFile(remotePath);
        return true;
    } catch (error) {
        console.error('Error deleting file:', error);
        throw new Error('Failed to delete file from Nextcloud');
    }
};

/**
 * Create a directory
 */
export const createDirectory = async (
    client: WebDAVClient,
    remotePath: string
): Promise<boolean> => {
    try {
        await client.createDirectory(remotePath, { recursive: true });
        return true;
    } catch (error) {
        console.error('Error creating directory:', error);
        throw new Error('Failed to create directory in Nextcloud');
    }
};

/**
 * Check if file/directory exists
 */
export const exists = async (
    client: WebDAVClient,
    remotePath: string
): Promise<boolean> => {
    try {
        return await client.exists(remotePath);
    } catch {
        return false;
    }
};

/**
 * Get file info
 */
export const getFileInfo = async (
    client: WebDAVClient,
    remotePath: string
): Promise<NextcloudFile | null> => {
    try {
        const stat = await client.stat(remotePath) as FileStat;
        return {
            filename: stat.filename,
            basename: stat.basename,
            type: stat.type as 'file' | 'directory',
            size: stat.size,
            lastmod: stat.lastmod,
            mime: stat.mime,
            etag: stat.etag ?? undefined,
        };
    } catch {
        return null;
    }
};

/**
 * Move/rename a file
 */
export const moveFile = async (
    client: WebDAVClient,
    fromPath: string,
    toPath: string
): Promise<boolean> => {
    try {
        await client.moveFile(fromPath, toPath);
        return true;
    } catch (error) {
        console.error('Error moving file:', error);
        throw new Error('Failed to move file in Nextcloud');
    }
};

/**
 * Copy a file
 */
export const copyFile = async (
    client: WebDAVClient,
    fromPath: string,
    toPath: string
): Promise<boolean> => {
    try {
        await client.copyFile(fromPath, toPath);
        return true;
    } catch (error) {
        console.error('Error copying file:', error);
        throw new Error('Failed to copy file in Nextcloud');
    }
};

export default {
    createNextcloudClient,
    getAdminClient,
    listFiles,
    uploadFile,
    downloadFile,
    deleteFile,
    createDirectory,
    exists,
    getFileInfo,
    moveFile,
    copyFile,
};
