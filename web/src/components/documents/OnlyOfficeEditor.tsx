'use client';

import { useState, useRef, useEffect } from 'react';
import NextImage from 'next/image';

interface OnlyOfficeEditorProps {
    documentUrl: string;
    documentType?: 'word' | 'cell' | 'slide';
    mode?: 'edit' | 'view' | 'review';
    title?: string;
    user?: {
        id: string;
        name: string;
    };
    onReady?: () => void;
    onError?: (error: string) => void;
    onSave?: (url: string) => void;
    className?: string;
}

const ONLYOFFICE_URL = process.env.NEXT_PUBLIC_ONLYOFFICE_URL || 'http://localhost:8088';

/**
 * OnlyOffice Document Editor Component
 * Embeds OnlyOffice for document editing via iframe
 */
export default function OnlyOfficeEditor({
    documentUrl,
    documentType = 'word',
    mode = 'edit',
    title = 'Belge',
    user,
    onReady,
    onError,
    onSave,
    className = '',
}: OnlyOfficeEditorProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // Document type to editor type mapping
    const editorTypes = {
        word: 'text',
        cell: 'spreadsheet',
        slide: 'presentation',
    };

    // File extension detection
    const getDocumentType = (url: string): 'word' | 'cell' | 'slide' => {
        const ext = url.split('.').pop()?.toLowerCase();
        if (['xlsx', 'xls', 'csv', 'ods'].includes(ext || '')) return 'cell';
        if (['pptx', 'ppt', 'odp'].includes(ext || '')) return 'slide';
        return 'word';
    };

    const actualDocType = documentType || getDocumentType(documentUrl);

    // Build the editor URL with parameters
    const buildEditorUrl = () => {
        const params = new URLSearchParams({
            url: documentUrl,
            title: title,
            mode: mode,
            type: editorTypes[actualDocType],
            key: Math.random().toString(36).slice(2), // Unique document key
        });

        if (user) {
            params.append('userId', user.id);
            params.append('userName', user.name);
        }

        return `${ONLYOFFICE_URL}/web-apps/apps/editor/main/index.html?${params.toString()}`;
    };

    const handleLoad = () => {
        setIsLoading(false);
        onReady?.();
    };

    const handleError = () => {
        setIsLoading(false);
        const errorMsg = 'OnlyOffice yüklenemedi. Sunucu erişilebilir olduğundan emin olun.';
        setError(errorMsg);
        onError?.(errorMsg);
    };

    // Listen for messages from the iframe
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.origin !== ONLYOFFICE_URL) return;

            const data = event.data;
            if (data.type === 'onSave') {
                onSave?.(data.url);
            }
            if (data.type === 'onError') {
                setError(data.message);
                onError?.(data.message);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [onSave, onError]);

    if (error) {
        return (
            <div className={`bg-white rounded-xl shadow-sm p-8 text-center ${className}`}>
                <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-3xl">📄</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Belge Yüklenemedi</h3>
                <p className="text-gray-500 mb-4">{error}</p>
                <button
                    onClick={() => {
                        setError(null);
                        setIsLoading(true);
                    }}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                    Tekrar Dene
                </button>
            </div>
        );
    }

    return (
        <div className={`relative ${className}`}>
            {isLoading && (
                <div className="absolute inset-0 bg-gray-100 rounded-xl flex items-center justify-center z-10">
                    <div className="text-center">
                        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-gray-500">Belge yükleniyor...</p>
                    </div>
                </div>
            )}
            <iframe
                ref={iframeRef}
                src={buildEditorUrl()}
                onLoad={handleLoad}
                onError={handleError}
                className="w-full h-full min-h-[600px] rounded-xl border-0"
                allow="fullscreen"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads"
            />
        </div>
    );
}

/**
 * OnlyOffice Viewer – Read-only document preview
 */
export function OnlyOfficeViewer({
    documentUrl,
    title,
    className = '',
}: {
    documentUrl: string;
    title?: string;
    className?: string;
}) {
    return (
        <OnlyOfficeEditor
            documentUrl={documentUrl}
            title={title}
            mode="view"
            className={className}
        />
    );
}

/**
 * Simple Document Embed Fallback
 * Uses browser's native file viewer for common formats
 */
export function DocumentEmbed({
    url,
    title = 'Belge',
    height = 600,
    className = '',
}: {
    url: string;
    title?: string;
    height?: number;
    className?: string;
}) {
    const ext = url.split('.').pop()?.toLowerCase();
    const isPdf = ext === 'pdf';
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '');

    if (isImage) {
        return (
            <div className={`rounded-xl overflow-hidden ${className}`}>
                <NextImage 
                    src={url} 
                    alt={title} 
                    className="max-w-full h-auto" 
                    width={800} 
                    height={600} 
                    unoptimized 
                />
            </div>
        );
    }

    if (isPdf) {
        return (
            <iframe
                src={url}
                title={title}
                className={`w-full rounded-xl border-0 ${className}`}
                style={{ height }}
            />
        );
    }

    // Fallback: Use Google Docs Viewer for other formats
    const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;

    return (
        <iframe
            src={googleViewerUrl}
            title={title}
            className={`w-full rounded-xl border-0 ${className}`}
            style={{ height }}
        />
    );
}
