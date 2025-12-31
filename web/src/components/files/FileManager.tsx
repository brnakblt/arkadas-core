/**
 * FileManager Component
 * Displays files from SFTPGo with upload, download, and delete functionality
 */

"use client";

import React, { useState, useCallback } from 'react';
import useSWR, { mutate } from 'swr';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faFolder,
    faFile,
    faFileImage,
    faFilePdf,
    faFileWord,
    faFileExcel,
    faUpload,
    faDownload,
    faTrash,
    faFolderPlus,
    faSpinner,
    faChevronLeft,
} from '@fortawesome/free-solid-svg-icons';

interface FileItem {
    filename: string;
    basename: string;
    type: 'file' | 'directory';
    size: number;
    lastmod: string;
    mime?: string;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

const getFileIcon = (file: FileItem) => {
    if (file.type === 'directory') return faFolder;

    const mime = file.mime || '';
    if (mime.startsWith('image/')) return faFileImage;
    if (mime === 'application/pdf') return faFilePdf;
    if (mime.includes('word') || mime.includes('document')) return faFileWord;
    if (mime.includes('excel') || mime.includes('spreadsheet')) return faFileExcel;

    return faFile;
};

const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

interface FileManagerProps {
    basePath?: string;
    onFileSelect?: (file: FileItem) => void;
}

const FileManager: React.FC<FileManagerProps> = ({ basePath = '/', onFileSelect }) => {
    const [currentPath, setCurrentPath] = useState(basePath);
    const [isUploading, setIsUploading] = useState(false);
    const [showNewFolderModal, setShowNewFolderModal] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');

    const { data, error, isLoading } = useSWR(
        `/api/v1/files?path=${encodeURIComponent(currentPath)}`,
        fetcher
    );

    const files: FileItem[] = data?.data || [];

    const handleNavigate = (file: FileItem) => {
        if (file.type === 'directory') {
            setCurrentPath(file.filename);
        } else if (onFileSelect) {
            onFileSelect(file);
        }
    };

    const handleGoBack = () => {
        const parentPath = currentPath.split('/').slice(0, -1).join('/') || '/';
        setCurrentPath(parentPath);
    };

    const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files?.length) return;

        setIsUploading(true);

        try {
            for (const file of Array.from(files)) {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('path', currentPath);

                await fetch('/api/v1/files/upload', {
                    method: 'POST',
                    body: formData,
                });
            }

            // Refresh file list
            mutate(`/api/v1/files?path=${encodeURIComponent(currentPath)}`);
        } catch (error) {
            console.error('Upload error:', error);
        } finally {
            setIsUploading(false);
            e.target.value = '';
        }
    }, [currentPath]);

    const handleDownload = async (file: FileItem) => {
        const encodedPath = encodeURIComponent(file.filename.slice(1)); // Remove leading /
        window.open(`/api/v1/files/${encodedPath}`, '_blank');
    };

    const handleDelete = async (file: FileItem) => {
        if (!confirm(`"${file.basename}" silinecek. Emin misiniz?`)) return;

        try {
            const encodedPath = file.filename.slice(1); // Remove leading /
            await fetch(`/api/v1/files/${encodedPath}`, {
                method: 'DELETE',
            });

            mutate(`/api/v1/files?path=${encodeURIComponent(currentPath)}`);
        } catch (error) {
            console.error('Delete error:', error);
        }
    };

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return;

        try {
            const newPath = currentPath.endsWith('/')
                ? `${currentPath}${newFolderName}`
                : `${currentPath}/${newFolderName}`;

            await fetch('/api/v1/files', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: newPath, type: 'directory' }),
            });

            mutate(`/api/v1/files?path=${encodeURIComponent(currentPath)}`);
            setShowNewFolderModal(false);
            setNewFolderName('');
        } catch (error) {
            console.error('Create folder error:', error);
        }
    };

    if (error) {
        return (
            <div className="p-6 text-center text-red-500">
                Dosyalar yüklenemedi. Lütfen tekrar deneyin.
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-primary/80 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {currentPath !== '/' && (
                            <button
                                onClick={handleGoBack}
                                className="text-white/80 hover:text-white transition-colors"
                            >
                                <FontAwesomeIcon icon={faChevronLeft} className="w-4 h-4" />
                            </button>
                        )}
                        <h2 className="text-white font-semibold text-lg">
                            Dosyalar
                        </h2>
                        <span className="text-white/60 text-sm">
                            {currentPath}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowNewFolderModal(true)}
                            className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
                        >
                            <FontAwesomeIcon icon={faFolderPlus} className="w-4 h-4" />
                            Yeni Klasör
                        </button>

                        <label className="px-3 py-1.5 bg-white text-primary text-sm font-medium rounded-lg cursor-pointer hover:bg-white/90 transition-colors flex items-center gap-2">
                            {isUploading ? (
                                <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 animate-spin" />
                            ) : (
                                <FontAwesomeIcon icon={faUpload} className="w-4 h-4" />
                            )}
                            Yükle
                            <input
                                type="file"
                                multiple
                                onChange={handleUpload}
                                className="hidden"
                                disabled={isUploading}
                            />
                        </label>
                    </div>
                </div>
            </div>

            {/* File List */}
            <div className="divide-y divide-gray-100">
                {isLoading ? (
                    <div className="p-8 text-center text-gray-500">
                        <FontAwesomeIcon icon={faSpinner} className="w-6 h-6 animate-spin mb-2" />
                        <p>Yükleniyor...</p>
                    </div>
                ) : files.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <FontAwesomeIcon icon={faFolder} className="w-12 h-12 mb-3 text-gray-300" />
                        <p>Bu klasör boş</p>
                    </div>
                ) : (
                    files.map((file) => (
                        <div
                            key={file.filename}
                            className="flex items-center gap-4 px-6 py-3 hover:bg-gray-50 transition-colors group"
                        >
                            <div
                                className={`flex-1 flex items-center gap-3 cursor-pointer ${file.type === 'directory' ? 'text-primary' : 'text-gray-700'
                                    }`}
                                onClick={() => handleNavigate(file)}
                            >
                                <FontAwesomeIcon
                                    icon={getFileIcon(file)}
                                    className={`w-5 h-5 ${file.type === 'directory' ? 'text-yellow-500' : 'text-gray-400'
                                        }`}
                                />
                                <span className="font-medium">{file.basename}</span>
                            </div>

                            <div className="text-sm text-gray-500 w-24 text-right">
                                {file.type === 'file' && formatFileSize(file.size)}
                            </div>

                            <div className="text-sm text-gray-400 w-36 text-right">
                                {formatDate(file.lastmod)}
                            </div>

                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {file.type === 'file' && (
                                    <button
                                        onClick={() => handleDownload(file)}
                                        className="p-2 text-gray-400 hover:text-primary transition-colors"
                                        title="İndir"
                                    >
                                        <FontAwesomeIcon icon={faDownload} className="w-4 h-4" />
                                    </button>
                                )}
                                <button
                                    onClick={() => handleDelete(file)}
                                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                    title="Sil"
                                >
                                    <FontAwesomeIcon icon={faTrash} className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* New Folder Modal */}
            {showNewFolderModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold mb-4">Yeni Klasör</h3>
                        <input
                            type="text"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            placeholder="Klasör adı"
                            className="w-full px-4 py-2 border rounded-lg mb-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                            autoFocus
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setShowNewFolderModal(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                İptal
                            </button>
                            <button
                                onClick={handleCreateFolder}
                                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                            >
                                Oluştur
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FileManager;
