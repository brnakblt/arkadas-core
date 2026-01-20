
"use client";

import React, { useState, useEffect } from 'react';
import { DocumentEditor as OnlyOfficeEditor } from "@onlyoffice/document-editor-react";
import { Loader2 } from 'lucide-react';

interface DocumentEditorProps {
    documentUrl: string;
    fileType: string;
    documentKey: string;
    title: string;
}

const DocumentEditor: React.FC<DocumentEditorProps> = ({ documentUrl, fileType, documentKey, title }) => {
    const [config, setConfig] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                // Public URL of your machine/domain where OnlyOffice can reach the file
                // For Docker/Dev, you might need internal IPs or public URLs.
                // Assuming documentUrl is publicly accessible or accessible by the container.

                const payload = {
                    document: {
                        fileType: fileType,
                        key: documentKey,
                        title: title,
                        url: documentUrl,
                    },
                    editorConfig: {
                        mode: 'edit',
                    },
                };

                const res = await fetch('/api/documents/config', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!res.ok) throw new Error('Failed to load config');

                const data = await res.json();
                setConfig(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        if (documentUrl) {
            fetchConfig();
        }
    }, [documentUrl, fileType, documentKey, title]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[600px] bg-slate-50 border border-slate-200 rounded-lg">
                <Loader2 className="animate-spin text-slate-400" size={32} />
            </div>
        );
    }

    if (!config) {
        return (
            <div className="flex items-center justify-center h-[600px] bg-red-50 border border-red-200 rounded-lg text-red-600 font-bold">
                Editör yüklenemedi.
            </div>
        );
    }

    return (
        <div className="h-[800px] w-full border border-slate-200 shadow-sm rounded-lg overflow-hidden">
            <OnlyOfficeEditor
                id="docxEditor"
                documentServerUrl="http://localhost:8080" // Port mapped in docker-compose
                config={config}
                events_onDocumentReady={() => console.log("Document Ready")}
                onLoadComponentError={(errorCode, errorDescription) => {
                    console.error("OnlyOffice Load Error:", errorCode, errorDescription);
                }}
            />
        </div>
    );
};

export default DocumentEditor;
