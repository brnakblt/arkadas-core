/**
 * useFiles Hook
 * Manages file operations from the mobile app to Nextcloud via web API
 */

import { useState, useCallback, useEffect } from 'react';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export interface FileItem {
    filename: string;
    basename: string;
    type: 'file' | 'directory';
    size: number;
    lastmod: string;
    mime?: string;
}

interface UseFilesReturn {
    files: FileItem[];
    currentPath: string;
    isLoading: boolean;
    error: string | null;
    navigate: (path: string) => void;
    goBack: () => void;
    refresh: () => void;
    uploadFile: (uri: string, filename: string) => Promise<boolean>;
    downloadFile: (file: FileItem) => Promise<string | null>;
    deleteFile: (file: FileItem) => Promise<boolean>;
    createFolder: (name: string) => Promise<boolean>;
    renameFile: (file: FileItem, newName: string) => Promise<boolean>;
}

export const useFiles = (initialPath: string = '/'): UseFilesReturn => {
    const [files, setFiles] = useState<FileItem[]>([]);
    const [currentPath, setCurrentPath] = useState(initialPath);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchFiles = useCallback(async (path: string) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(
                `${API_BASE_URL}/api/v1/files?path=${encodeURIComponent(path)}`
            );
            const data = await response.json();

            if (data.success) {
                setFiles(data.data || []);
            } else {
                throw new Error(data.error || 'Dosyalar yüklenemedi');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Bilinmeyen hata');
            setFiles([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchFiles(currentPath);
    }, [currentPath, fetchFiles]);

    const navigate = useCallback((path: string) => {
        setCurrentPath(path);
    }, []);

    const goBack = useCallback(() => {
        const parentPath = currentPath.split('/').slice(0, -1).join('/') || '/';
        setCurrentPath(parentPath);
    }, [currentPath]);

    const refresh = useCallback(() => {
        fetchFiles(currentPath);
    }, [currentPath, fetchFiles]);

    const uploadFile = useCallback(async (uri: string, filename: string): Promise<boolean> => {
        try {
            const formData = new FormData();
            formData.append('file', {
                uri,
                name: filename,
                type: 'application/octet-stream',
            } as any);
            formData.append('path', currentPath);

            const response = await fetch(`${API_BASE_URL}/api/v1/files/upload`, {
                method: 'POST',
                body: formData,
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            const data = await response.json();
            if (data.success) {
                refresh();
                return true;
            }
            throw new Error(data.error);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Yükleme hatası');
            return false;
        }
    }, [currentPath, refresh]);

    const downloadFile = useCallback(async (file: FileItem): Promise<string | null> => {
        try {
            const encodedPath = encodeURIComponent(file.filename.slice(1));
            // Return the download URL for the file
            return `${API_BASE_URL}/api/v1/files/${encodedPath}`;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'İndirme hatası');
            return null;
        }
    }, []);

    const deleteFile = useCallback(async (file: FileItem): Promise<boolean> => {
        try {
            console.log('Attempting to delete file:', file.filename);
            const encodedPath = encodeURIComponent(file.filename.slice(1)); // Fix encoding
            const url = `${API_BASE_URL}/api/v1/files/${encodedPath}`; // Construct URL explicitly for logging
            console.log('Delete URL:', url);
            
            const response = await fetch(url, {
                method: 'DELETE',
            });
            
            console.log('Delete response status:', response.status);
            const data = await response.json();
            console.log('Delete response data:', data);

            if (data.success) {
                refresh();
                return true;
            }
            throw new Error(data.error);
        } catch (err) {
            console.error('Delete error:', err);
            setError(err instanceof Error ? err.message : 'Silme hatası');
            return false;
        }
    }, [refresh]);

    const createFolder = useCallback(async (name: string): Promise<boolean> => {
        try {
            // Security: Sanitize folder name to prevent path traversal
            const sanitizedName = name
                .replace(/\.\./g, '')  // Remove traversal sequences
                .replace(/[\/\\]/g, '') // Remove path separators
                .replace(/[<>:"|?*]/g, '') // Remove invalid characters
                .trim();

            if (!sanitizedName || sanitizedName.length === 0) {
                setError('Geçersiz klasör adı');
                return false;
            }

            const newPath = currentPath.endsWith('/')
                ? `${currentPath}${sanitizedName}`
                : `${currentPath}/${sanitizedName}`;

            const response = await fetch(`${API_BASE_URL}/api/v1/files`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: newPath, type: 'directory' }),
            });

            const data = await response.json();
            if (data.success) {
                refresh();
                return true;
            }
            throw new Error(data.error);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Klasör oluşturma hatası');
            return false;
        }
    }, [currentPath, refresh]);

    const renameFile = useCallback(async (file: FileItem, newName: string): Promise<boolean> => {
        try {
             // Security: Sanitize folder name to prevent path traversal
             const sanitizedName = newName
                .replace(/\.\./g, '')
                .replace(/[\/\\]/g, '')
                .replace(/[<>:"|?*]/g, '')
                .trim();
            
            if (!sanitizedName) {
                setError('Geçersiz dosya adı');
                return false;
            }

            const encodedPath = encodeURIComponent(file.filename.slice(1)); // Fix encoding
            // Construct new path: parent directory of current file + new name
            // file.filename includes full path e.g. /Folder/file.txt
            const parentDir = file.filename.substring(0, file.filename.lastIndexOf('/'));
            const destination = parentDir === '' ? `/${sanitizedName}` : `${parentDir}/${sanitizedName}`;

            const response = await fetch(`${API_BASE_URL}/api/v1/files/${encodedPath}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ destination }),
            });

            const data = await response.json();
            if (data.success) {
                refresh();
                return true;
            }
            throw new Error(data.error);
        } catch (err) {
             setError(err instanceof Error ? err.message : 'Yeniden adlandırma hatası');
             return false;
        }
    }, [refresh]);

    return {
        files,
        currentPath,
        isLoading,
        error,
        navigate,
        goBack,
        refresh,
        uploadFile,
        downloadFile,
        deleteFile,
        createFolder,
        renameFile,
    };
};

export default useFiles;
