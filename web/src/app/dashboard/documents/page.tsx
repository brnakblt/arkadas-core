
"use client";

import React, { useState } from 'react';
import DocumentEditor from '@/components/documents/DocumentEditor';
import { FileText, FileSpreadsheet, X } from 'lucide-react';

const DocumentsPage: React.FC = () => {
    const [selectedFile, setSelectedFile] = useState<any>(null);

    // Mock Files - Ideally served from your public folder or SFTPGo
    // For localhost testing, ensure these are accessible by the OnlyOffice container if using docker network, 
    // or use a public URL service (ngrok) if locally testing.
    // Here we use a placeholder placeholder URL logic for now.
    const FILES = [
        {
            id: 'doc1',
            title: 'Öğrenci Sözleşmesi.docx',
            type: 'docx',
            // Using a public sample for demonstration as localhost networking between container and host can be tricky
            url: 'https://filesamples.com/samples/document/docx/sample4.docx'
        },
        {
            id: 'doc2',
            title: 'Haftalık Program.xlsx',
            type: 'xlsx',
            url: 'https://filesamples.com/samples/document/xlsx/sample3.xlsx'
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <FileText className="text-blue-600" />
                        Doküman Yönetimi
                    </h1>
                    <p className="text-slate-500">Kurumsal dokümanları düzenleyin ve yönetin (OnlyOffice Entegrasyonu).</p>
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
                    <DocumentEditor
                        documentUrl={selectedFile.url}
                        fileType={selectedFile.type}
                        documentKey={selectedFile.id + Date.now()} // Generate unique key to force refresh or collaborative session
                        title={selectedFile.title}
                    />
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
