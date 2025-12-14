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
            const encodedPath = file.filename.slice(1);
            const response = await fetch(`${API_BASE_URL}/api/v1/files/${encodedPath}`, {
                method: 'DELETE',
            });

            const data = await response.json();
            if (data.success) {
                refresh();
                return true;
            }
            throw new Error(data.error);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Silme hatası');
            return false;
        }
    }, [refresh]);

    const createFolder = useCallback(async (name: string): Promise<boolean> => {
        try {
            const newPath = currentPath.endsWith('/')
                ? `${currentPath}${name}`
                : `${currentPath}/${name}`;

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
    };
};

export default useFiles;
