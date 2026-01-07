/**
 * OnlyOffice Document Editor Configuration
 * Handles document editing with OnlyOffice Document Server
 */

import crypto from 'crypto';

const ONLYOFFICE_URL = process.env.ONLYOFFICE_URL || 'http://localhost:8088';
const ONLYOFFICE_JWT_SECRET = process.env.ONLYOFFICE_JWT_SECRET || '';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export interface DocumentConfig {
    documentType: 'word' | 'cell' | 'slide';
    document: {
        fileType: string;
        key: string;
        title: string;
        url: string;
        permissions?: {
            edit: boolean;
            download: boolean;
            print: boolean;
        };
    };
    editorConfig: {
        callbackUrl: string;
        mode: 'edit' | 'view';
        user: {
            id: string;
            name: string;
        };
        lang?: string;
        customization?: {
            autosave?: boolean;
            forcesave?: boolean;
        };
    };
    token?: string;
}

/**
 * Get document type based on file extension
 */
export const getDocumentType = (filename: string): 'word' | 'cell' | 'slide' => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';

    const wordExts = ['doc', 'docx', 'odt', 'rtf', 'txt', 'pdf'];
    const cellExts = ['xls', 'xlsx', 'ods', 'csv'];
    const slideExts = ['ppt', 'pptx', 'odp'];

    if (wordExts.includes(ext)) return 'word';
    if (cellExts.includes(ext)) return 'cell';
    if (slideExts.includes(ext)) return 'slide';

    return 'word'; // Default
};

/**
 * Get file type from filename
 */
export const getFileType = (filename: string): string => {
    return filename.split('.').pop()?.toLowerCase() || 'docx';
};

/**
 * Generate unique document key
 */
export const generateDocumentKey = (fileId: string, lastModified?: string): string => {
    const data = `${fileId}-${lastModified || Date.now()}`;
    return crypto.createHash('md5').update(data).digest('hex');
};

/**
 * Generate JWT token for OnlyOffice
 */
export const generateToken = (payload: object): string => {
    if (!ONLYOFFICE_JWT_SECRET) {
        return '';
    }

    const header = { alg: 'HS256', typ: 'JWT' };

    const base64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
    const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64url');

    const signature = crypto
        .createHmac('sha256', ONLYOFFICE_JWT_SECRET)
        .update(`${base64Header}.${base64Payload}`)
        .digest('base64url');

    return `${base64Header}.${base64Payload}.${signature}`;
};

/**
 * Create editor configuration for a document
 */
export const createEditorConfig = (params: {
    fileId: string;
    filename: string;
    fileUrl: string;
    userId: string;
    userName: string;
    lastModified?: string;
    mode?: 'edit' | 'view';
}): DocumentConfig => {
    const { fileId, filename, fileUrl, userId, userName, lastModified, mode = 'edit' } = params;

    const config: DocumentConfig = {
        documentType: getDocumentType(filename),
        document: {
            fileType: getFileType(filename),
            key: generateDocumentKey(fileId, lastModified),
            title: filename,
            url: fileUrl,
            permissions: {
                edit: mode === 'edit',
                download: true,
                print: true,
            },
        },
        editorConfig: {
            callbackUrl: `${APP_URL}/api/v1/documents/callback`,
            mode,
            user: {
                id: userId,
                name: userName,
            },
            lang: 'tr',
            customization: {
                autosave: true,
                forcesave: true,
            },
        },
    };

    // Add JWT token if secret is configured
    if (ONLYOFFICE_JWT_SECRET) {
        config.token = generateToken(config);
    }

    return config;
};

/**
 * Get OnlyOffice Document Server URL
 */
export const getDocumentServerUrl = (): string => {
    return ONLYOFFICE_URL;
};

export default {
    getDocumentType,
    getFileType,
    generateDocumentKey,
    generateToken,
    createEditorConfig,
    getDocumentServerUrl,
};
