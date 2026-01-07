'use client';

import { useState, useEffect } from 'react';
import VirtualizedFileList from '@/components/files/VirtualizedFileList';
interface FileItem {
    id: string;
    name: string;
    mimeType?: string;
    size: number;
    isDirectory: boolean;
    updatedAt: string;
}

export default function FilesPage() {
    const [files, setFiles] = useState<FileItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPath, setCurrentPath] = useState('/');

    useEffect(() => {
        // Mock fetch
        fetchFiles(currentPath);
    }, [currentPath]);

    const fetchFiles = async (path: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/v1/storage?path=${encodeURIComponent(path)}`);
            if (res.ok) {
                const data = await res.json();
                // data.data is expected to be the list from Strapi
                // Ensure it matches the interface
                setFiles(data.data || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleFileClick = (file: FileItem) => {
        if (file.isDirectory) {
            setCurrentPath((prev) => (prev === '/' ? `/${file.name}` : `${prev}/${file.name}`));
        } else {
            // console.log('Open file:', file.name);
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Dosyalarım</h1>
            <div className="mb-4 text-sm text-gray-500">
                Konum: {currentPath}
                {currentPath !== '/' && (
                    <button
                        onClick={() => setCurrentPath('/')}
                        className="ml-4 text-blue-500 hover:underline"
                    >
                        Ana Dizin
                    </button>
                )}
            </div>

            {loading ? (
                <div className="text-center py-10">Yükleniyor...</div>
            ) : (
                <VirtualizedFileList files={files} onFileClick={handleFileClick} />
            )}
        </div>
    );
}
