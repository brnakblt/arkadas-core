
"use client";

import React, { useState, useEffect } from 'react';
import CollaboraEditor from '@/components/documents/CollaboraEditor';
import { FileText, FileSpreadsheet, X } from 'lucide-react';

interface FileItem {
    id: string;
    title: string;
    type: string;
    url: string;
}

interface EditorConfig {
    editorUrl: string;
    accessToken: string;
}

const DocumentsPage: React.FC = () => {
    const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
    const [editorConfig, setEditorConfig] = useState<EditorConfig | null>(null);
    const [loading, setLoading] = useState(false);

    // Mock Files - Ideally served from SFTPGo storage
    const FILES = [
        {
            id: 'doc1',
            title: 'Öğrenci Sözleşmesi.docx',
            type: 'docx',
            url: 'https://filesamples.com/samples/document/docx/sample4.docx'
        },
        {
            id: 'doc2',
            title: 'Haftalık Program.xlsx',
            type: 'xlsx',
            url: 'https://filesamples.com/samples/document/xlsx/sample3.xlsx'
        }
    ];

    // Fetch Collabora editor configuration when a file is selected
    useEffect(() => {
        if (!selectedFile) {
            setEditorConfig(null);
            return;
        }

        const fetchEditorConfig = async () => {
            setLoading(true);
            try {
                const fileId = Buffer.from(`/${selectedFile.id}.${selectedFile.type}`).toString('base64url');
                const res = await fetch(`/api/v1/documents/${fileId}/editor`);
                if (!res.ok) throw new Error('Failed to load editor config');
                const data = await res.json();
                setEditorConfig({
                    editorUrl: data.editorUrl,
                    accessToken: data.accessToken,
                });
            } catch (error) {
                console.error('Failed to load editor:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchEditorConfig();
    }, [selectedFile]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <FileText className="text-blue-600" />
                        Doküman Yönetimi
                    </h1>
                    <p className="text-slate-500">Kurumsal dokümanları düzenleyin ve yönetin (Collabora Entegrasyonu).</p>
                </div>
            </div>

            {selectedFile ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                    <button
                        onClick={() => setSelectedFile(null)}
                        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition font-medium"
                    >
                        <X size={20} /> Kapat ve Listeye Dön
                    </button>
                    {loading ? (
                        <div className="flex items-center justify-center h-[600px] bg-slate-50 border border-slate-200 rounded-lg">
                            <div className="text-center">
                                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                                <p className="text-slate-400">Editör yükleniyor...</p>
                            </div>
                        </div>
                    ) : editorConfig ? (
                        <CollaboraEditor
                            fileId={selectedFile.id}
                            accessToken={editorConfig.accessToken}
                            editorUrl={editorConfig.editorUrl}
                            title={selectedFile.title}
                        />
                    ) : (
                        <div className="flex items-center justify-center h-[600px] bg-red-50 border border-red-200 rounded-lg text-red-600 font-bold">
                            Editör yüklenemedi.
                        </div>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {FILES.map(file => (
                        <button
                            key={file.id}
                            onClick={() => setSelectedFile(file)}
                            className="bg-white p-6 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all group text-left"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className={`p-3 rounded-lg ${file.type === 'docx' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                                    {file.type === 'docx' ? <FileText size={24} /> : <FileSpreadsheet size={24} />}
                                </div>
                            </div>
                            <h3 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{file.title}</h3>
                            <p className="text-xs text-slate-400 mt-1">Son düzenleme: Bugün</p>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DocumentsPage;
