/**
 * Collabora Online Document Editor Configuration
 * Handles document editing via WOPI protocol with Collabora CODE
 * License: MPL-2.0 (commercially free)
 */

import crypto from 'crypto';

const COLLABORA_URL = process.env.COLLABORA_URL || 'http://localhost:9980';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const WOPI_SECRET = process.env.JWT_SECRET || 'default-wopi-secret';

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
 * Generate a WOPI access token for file operations
 * This token is validated by the WOPI endpoint when Collabora requests file content
 */
export const generateAccessToken = (fileId: string, userId: string): string => {
    const payload = {
        fileId,
        userId,
        exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiry
        iat: Math.floor(Date.now() / 1000),
    };

    const header = { alg: 'HS256', typ: 'JWT' };
    const base64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
    const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64url');

    const signature = crypto
        .createHmac('sha256', WOPI_SECRET)
        .update(`${base64Header}.${base64Payload}`)
        .digest('base64url');

    return `${base64Header}.${base64Payload}.${signature}`;
};

/**
 * Verify a WOPI access token
 * Returns the decoded payload if valid, null otherwise
 */
export const verifyAccessToken = (token: string): { fileId: string; userId: string; exp: number } | null => {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;

        const [header, payload, signature] = parts;
        const expectedSignature = crypto
            .createHmac('sha256', WOPI_SECRET)
            .update(`${header}.${payload}`)
            .digest('base64url');

        if (signature !== expectedSignature) return null;

        const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString());

        // Check expiry
        if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) return null;

        return decoded;
    } catch {
        return null;
    }
};

/**
 * Build the full Collabora editor iframe URL
 * Collabora expects: {collabora_url}/browser/dist/cool.html?WOPISrc={wopi_url}&access_token={token}
 */
export const getCollaboraEditorUrl = (wopiSrc: string, accessToken: string): string => {
    const params = new URLSearchParams({
        WOPISrc: wopiSrc,
        access_token: accessToken,
    });

    return `${COLLABORA_URL}/browser/dist/cool.html?${params.toString()}`;
};

/**
 * Build the WOPI source URL for a file
 * This is the URL Collabora will call to get file info and content
 */
export const getWopiSrc = (fileId: string): string => {
    const encodedFileId = encodeURIComponent(fileId);
    return `${APP_URL}/api/wopi/files/${encodedFileId}`;
};

/**
 * Get Collabora server URL (for CSP and health checks)
 */
export const getCollaboraUrl = (): string => {
    return COLLABORA_URL;
};

export default {
    getDocumentType,
    getFileType,
    generateDocumentKey,
    generateAccessToken,
    verifyAccessToken,
    getCollaboraEditorUrl,
    getWopiSrc,
    getCollaboraUrl,
};
