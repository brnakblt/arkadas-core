import { createClient, AuthType } from "webdav";
import { Readable } from 'stream';

// Environment variables for WebDAV connection
const SFTPGO_URL = process.env.SFTPGO_WEBDAV_URL || "http://localhost:8089";
const SFTPGO_USERNAME = process.env.SFTPGO_USER || "app-user";
const SFTPGO_PASSWORD = process.env.SFTPGO_PASSWORD || "arkadas-app-pass";

// Create WebDAV client
const client = createClient(SFTPGO_URL, {
    authType: AuthType.Password,
    username: SFTPGO_USERNAME,
    password: SFTPGO_PASSWORD
});

export interface FileInfo {
    filename: string;
    basename: string;
    lastmod: string;
    size: number;
    type: "directory" | "file";
    mime?: string;
}

export const storage = {
    /**
     * List files in a directory
     */
    async listFiles(path: string = "/"): Promise<FileInfo[]> {
        try {
            const result = await client.getDirectoryContents(path);
            return result as FileInfo[];
        } catch (_error) {
            console.error("[Storage] List files error:", _error);
            throw _error;
        }
    },

    /**
     * Upload a file
     */
    async uploadFile(path: string, data: string | Buffer | Readable): Promise<boolean> {
        try {
            await client.putFileContents(path, data, { overwrite: true });
            return true;
        } catch (_error) {
            console.error("[Storage] Upload error:", _error);
            throw _error;
        }
    },

    /**
     * Get file contents
     */
    async getFile(path: string): Promise<Buffer> {
        try {
            const content = await client.getFileContents(path, { format: "binary" });
            return content as Buffer;
        } catch (_error) {
            console.error("[Storage] Get file error:", _error);
            throw _error;
        }
    },

    /**
     * Delete a file
     */
    async deleteFile(path: string): Promise<boolean> {
        try {
            await client.deleteFile(path);
            return true;
        } catch (_error) {
            console.error("[Storage] Delete error:", _error);
            throw _error;
        }
    },

    /**
     * Create a directory
     */
    async createDirectory(path: string): Promise<boolean> {
        try {
            await client.createDirectory(path);
            return true;
        } catch (_error) {
            // Ignore if already exists (WebDAV might throw)
            console.error("[Storage] Create directory error:", _error);
            return false;
        }
    },

    /**
     * Check if file/directory exists
     */
    async exists(path: string): Promise<boolean> {
        try {
            return await client.exists(path);
        } catch {
            return false;
        }
    }
};

export default storage;
