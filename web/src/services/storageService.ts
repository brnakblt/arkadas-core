/**
 * Storage Service
 * WebDAV client for file operations with SFTPGo
 */

import { createClient, WebDAVClient, FileStat } from 'webdav';

interface StorageConfig {
    baseUrl: string;
    username: string;
    password: string;
}

interface FileInfo {
    filename: string;
    basename: string;
    type: 'file' | 'directory';
    size: number;
    lastmod: string;
    etag?: string;
    mime?: string;
}

class StorageService {
    private client: WebDAVClient | null = null;
    private config: StorageConfig | null = null;

    /**
     * Initialize with WebDAV credentials
     */
    init(config: StorageConfig) {
        this.config = config;
        this.client = createClient(config.baseUrl, {
            username: config.username,
            password: config.password,
        });
    }

    /**
     * Check if service is initialized
     */
    private ensureInitialized(): WebDAVClient {
        if (!this.client) {
            throw new Error('StorageService not initialized. Call init() first.');
        }
        return this.client;
    }

    /**
     * List directory contents
     */
    async listDirectory(path: string = '/'): Promise<FileInfo[]> {
        const client = this.ensureInitialized();
        const items = await client.getDirectoryContents(path) as FileStat[];

        return items.map((item) => ({
            filename: item.filename,
            basename: item.basename,
            type: item.type as 'file' | 'directory',
            size: item.size,
            lastmod: item.lastmod,
            etag: item.etag ?? undefined,
            mime: item.mime,
        }));
    }

    /**
     * Upload file
     */
    async uploadFile(remotePath: string, data: Buffer | string): Promise<void> {
        const client = this.ensureInitialized();
        await client.putFileContents(remotePath, data);
    }

    /**
     * Download file
     */
    async downloadFile(remotePath: string): Promise<Buffer> {
        const client = this.ensureInitialized();
        const content = await client.getFileContents(remotePath);
        return content as Buffer;
    }

    /**
     * Create directory
     */
    async createDirectory(path: string): Promise<void> {
        const client = this.ensureInitialized();
        await client.createDirectory(path);
    }

    /**
     * Delete file or directory
     */
    async delete(path: string): Promise<void> {
        const client = this.ensureInitialized();
        await client.deleteFile(path);
    }

    /**
     * Move/rename file or directory
     */
    async move(fromPath: string, toPath: string): Promise<void> {
        const client = this.ensureInitialized();
        await client.moveFile(fromPath, toPath);
    }

    /**
     * Copy file or directory
     */
    async copy(fromPath: string, toPath: string): Promise<void> {
        const client = this.ensureInitialized();
        await client.copyFile(fromPath, toPath);
    }

    /**
     * Check if path exists
     */
    async exists(path: string): Promise<boolean> {
        const client = this.ensureInitialized();
        return client.exists(path);
    }

    /**
     * Get file stats
     */
    async stat(path: string): Promise<FileInfo | null> {
        const client = this.ensureInitialized();
        try {
            const stat = await client.stat(path) as FileStat;
            return {
                filename: stat.filename,
                basename: stat.basename,
                type: stat.type as 'file' | 'directory',
                size: stat.size,
                lastmod: stat.lastmod,
                etag: stat.etag ?? undefined,
                mime: stat.mime,
            };
        } catch {
            return null;
        }
    }

    /**
     * Get WebDAV URL for direct access
     */
    getWebDAVUrl(): string {
        if (!this.config) {
            throw new Error('StorageService not initialized');
        }
        return this.config.baseUrl;
    }
}

// Singleton instance
const storageService = new StorageService();

export default storageService;
export { StorageService };
export type { StorageConfig, FileInfo };
