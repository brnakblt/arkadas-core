/**
 * DocumentEditor Component
 * Renders OnlyOffice Document Editor for editing files
 */

"use client";

import React, { useState, useEffect } from 'react';
import { DocumentEditor } from '@onlyoffice/document-editor-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faTimes, faExpand, faCompress } from '@fortawesome/free-solid-svg-icons';

interface DocumentEditorProps {
    fileId: string;
    filename: string;
    onClose?: () => void;
    mode?: 'edit' | 'view';
}

interface EditorConfig {
    documentType: string;
    document: {
        fileType: string;
        key: string;
        title: string;
        url: string;
    };
    editorConfig: {
        callbackUrl: string;
        mode: string;
        user: { id: string; name: string };
    };
    token?: string;
}

const DocumentEditorWrapper: React.FC<DocumentEditorProps> = ({
    fileId,
    filename,
    onClose,
    mode = 'edit',
}) => {
    const [config, setConfig] = useState<EditorConfig | null>(null);
    const [documentServerUrl, setDocumentServerUrl] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                // Encode file path as base64url for the ID
                const encodedId = Buffer.from(fileId).toString('base64url');
                const response = await fetch(`/api/v1/documents/${encodedId}/editor?mode=${mode}`);

                if (!response.ok) {
                    throw new Error('Failed to fetch editor configuration');
                }

                const data = await response.json();

                if (!data.success) {
                    throw new Error(data.error || 'Unknown error');
                }

                setDocumentServerUrl(data.documentServerUrl);
                setConfig(data.config);
            } catch (err) {
                console.error('Error loading editor:', err);
                setError(err instanceof Error ? err.message : 'Failed to load editor');
            }
        };

        fetchConfig();
    }, [fileId, mode]);

    const handleDocumentReady = () => {
        console.log('Document is ready for editing');
    };

    const handleLoadComponentError = (errorCode: number, errorDescription: string) => {
        console.error('Editor load error:', errorCode, errorDescription);
        setError(`Editör yüklenemedi: ${errorDescription}`);
    };

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-96 bg-gray-50 rounded-xl">
                <div className="text-red-500 mb-4">⚠️ {error}</div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                        Kapat
                    </button>
                )}
            </div>
        );
    }

    if (!config || !documentServerUrl) {
        return (
            <div className="flex items-center justify-center h-96 bg-gray-50 rounded-xl">
                <FontAwesomeIcon icon={faSpinner} className="w-8 h-8 animate-spin text-primary" />
                <span className="ml-3 text-gray-600">Editör yükleniyor...</span>
            </div>
        );
    }

    return (
        <div className={`bg-white rounded-xl overflow-hidden shadow-lg ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gray-100 border-b">
                <h3 className="font-semibold text-gray-800 truncate">{filename}</h3>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                        title={isFullscreen ? 'Küçült' : 'Tam Ekran'}
                    >
                        <FontAwesomeIcon icon={isFullscreen ? faCompress : faExpand} className="w-4 h-4" />
                    </button>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Kapat"
                        >
                            <FontAwesomeIcon icon={faTimes} className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Editor */}
            <div className={isFullscreen ? 'h-[calc(100vh-48px)]' : 'h-[600px]'}>
                <DocumentEditor
                    id="onlyoffice-editor"
                    documentServerUrl={documentServerUrl}
                    config={config}
                    events_onDocumentReady={handleDocumentReady}
                    onLoadComponentError={handleLoadComponentError}
                />
            </div>
        </div>
    );
};

export default DocumentEditorWrapper;
