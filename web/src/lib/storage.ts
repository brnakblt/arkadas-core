/**
 * Storage Client - Routes through Strapi API
 * Strapi handles authentication and proxies to SFTPGo
 */

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";

export interface FileInfo {
    filename: string;
    basename: string;
    lastmod?: string;
    size: number;
    type: "directory" | "file";
    mime?: string;
}

async function getAuthHeaders(): Promise<HeadersInit> {
    // Get JWT from localStorage or session (client-side)
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('strapi_jwt');
        if (token) {
            return { 'Authorization': `Bearer ${token}` };
        }
    }
    return {};
}

export const storage = {
    /**
     * List files in a directory via Strapi
     */
    async listFiles(path: string = "/"): Promise<FileInfo[]> {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(`${STRAPI_URL}/api/storage-files/list?path=${encodeURIComponent(path)}`, {
                headers,
            });

            if (!response.ok) {
                throw new Error(`List failed: ${response.status}`);
            }

            const result = await response.json();
            return result.data || [];
        } catch (_error) {
            console.error("[Storage] List files error:", _error);
            throw _error;
        }
    },

    /**
     * Upload a file via Strapi
     */
    async uploadFile(path: string, file: File): Promise<boolean> {
        try {
            const headers = await getAuthHeaders();
            const formData = new FormData();
            formData.append('file', file);
            formData.append('path', path);

            const response = await fetch(`${STRAPI_URL}/api/storage-files/upload`, {
                method: 'POST',
                headers,
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`Upload failed: ${response.status}`);
            }

            return true;
        } catch (_error) {
            console.error("[Storage] Upload error:", _error);
            throw _error;
        }
    },

    /**
     * Get file contents via Strapi
     */
    async getFile(fileId: number | string): Promise<Blob> {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(`${STRAPI_URL}/api/storage-files/${fileId}/download`, {
                headers,
            });

            if (!response.ok) {
                throw new Error(`Download failed: ${response.status}`);
            }

            return await response.blob();
        } catch (_error) {
            console.error("[Storage] Get file error:", _error);
            throw _error;
        }
    },

    /**
     * Get user's files from database
     */
    async getMyFiles(): Promise<FileInfo[]> {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(`${STRAPI_URL}/api/storage-files/mine`, {
                headers,
            });

            if (!response.ok) {
                throw new Error(`Fetch failed: ${response.status}`);
            }

            const result = await response.json();
            return result.data || [];
        } catch (_error) {
            console.error("[Storage] Get my files error:", _error);
            throw _error;
        }
    },

    /**
     * Create a directory via Strapi
     */
    async createDirectory(name: string, parentId?: number): Promise<boolean> {
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(`${STRAPI_URL}/api/storage-files/folder`, {
                method: 'POST',
                headers: {
                    ...headers,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, parentId }),
            });

            if (!response.ok) {
                throw new Error(`Create directory failed: ${response.status}`);
            }

            return true;
        } catch (_error) {
            console.error("[Storage] Create directory error:", _error);
            return false;
        }
    },
};

export default storage;

