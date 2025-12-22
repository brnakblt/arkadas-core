'use client';

import React, { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// Ensure you have these icons imported in your library or import individually
import { faFolder, faFile, faFileImage, faFilePdf } from '@fortawesome/free-solid-svg-icons';

interface FileItem {
    id: string;
    name: string;
    mimeType?: string;
    size: number;
    isDirectory: boolean;
    updatedAt: string;
}

interface VirtualizedFileListProps {
    files: FileItem[];
    onFileClick: (file: FileItem) => void;
}

const getIconForFile = (file: FileItem) => {
    if (file.isDirectory) return faFolder;
    if (file.mimeType?.startsWith('image/')) return faFileImage;
    if (file.mimeType === 'application/pdf') return faFilePdf;
    return faFile;
};

const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default function VirtualizedFileList({ files, onFileClick }: VirtualizedFileListProps) {
    const parentRef = useRef<HTMLDivElement>(null);

    const rowVirtualizer = useVirtualizer({
        count: files.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 50, // Height of each row
        overscan: 5,
    });

    return (
        <div
            ref={parentRef}
            className="h-[600px] w-full overflow-auto border border-gray-200 rounded-md bg-white dark:bg-gray-800 dark:border-gray-700"
        >
            <div
                style={{
                    height: `${rowVirtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                }}
            >
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const file = files[virtualRow.index];
                    return (
                        <div
                            key={virtualRow.key}
                            onClick={() => onFileClick(file)}
                            className="absolute top-0 left-0 w-full flex items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 transition-colors"
                            style={{
                                height: `${virtualRow.size}px`,
                                transform: `translateY(${virtualRow.start}px)`,
                            }}
                        >
                            <div className="w-10 flex justify-center text-gray-400">
                                <FontAwesomeIcon icon={getIconForFile(file)} className="text-xl" />
                            </div>
                            <div className="flex-1 min-w-0 px-4">
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                    {file.name}
                                </p>
                                <div className="flex text-xs text-gray-500 space-x-2">
                                    <span>{new Date(file.updatedAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                            <div className="text-xs text-gray-500 tabular-nums">
                                {file.isDirectory ? '-' : formatSize(file.size)}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
