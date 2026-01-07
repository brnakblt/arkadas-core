'use client';

import { useState } from 'react';
import FileManager from '@/components/files/FileManager';
import DocumentEditor from '@/components/documents/DocumentEditor';

interface SelectedFile {
    filename: string;
    basename: string;
}

// Editable file extensions
const EDITABLE_EXTENSIONS = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'ods', 'odp', 'txt', 'rtf'];

const isEditable = (filename: string): boolean => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    return EDITABLE_EXTENSIONS.includes(ext);
};

export default function DocumentsPage() {
    const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);

    const handleFileSelect = (file: { filename: string; basename: string; type: string }) => {
        if (file.type === 'file' && isEditable(file.basename)) {
            setSelectedFile({ filename: file.filename, basename: file.basename });
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Doküman Yönetimi</h1>
                <p className="text-gray-500 mt-2">
                    Dosyalarınızı yükleyin, düzenleyin ve yönetin.
                </p>
            </div>

            {selectedFile ? (
                <DocumentEditor
                    fileId={selectedFile.filename}
                    filename={selectedFile.basename}
                    onClose={() => setSelectedFile(null)}
                    mode="edit"
                />
            ) : (
                <FileManager basePath="/" onFileSelect={handleFileSelect} />
            )}
        </div>
    );
}


