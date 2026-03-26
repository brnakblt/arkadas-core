/**
 * WOPI Host Implementation for Collabora Online
 * Implements the WOPI protocol for document access:
 * - CheckFileInfo: GET /api/wopi/files/{fileId}
 * - GetFile: GET /api/wopi/files/{fileId}/contents
 * - PutFile: POST /api/wopi/files/{fileId}/contents
 *
 * Reference: https://learn.microsoft.com/en-us/microsoft-365/cloud-storage-partner-program/rest/
 */

/* eslint-disable no-console */
import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/collabora';
import storageService from '@/services/storageService';

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    const { path } = await params;

    // Extract access_token from query params
    const accessToken = request.nextUrl.searchParams.get('access_token');
    if (!accessToken) {
        return NextResponse.json({ error: 'Missing access token' }, { status: 401 });
    }

    const tokenData = verifyAccessToken(accessToken);
    if (!tokenData) {
        return NextResponse.json({ error: 'Invalid access token' }, { status: 401 });
    }

    // Parse WOPI path: /api/wopi/files/{fileId} or /api/wopi/files/{fileId}/contents
    // path = ['files', '{fileId}'] or ['files', '{fileId}', 'contents']
    if (path[0] !== 'files' || !path[1]) {
        return NextResponse.json({ error: 'Invalid WOPI request' }, { status: 404 });
    }

    const fileId = decodeURIComponent(path[1]);
    const isContentsRequest = path[2] === 'contents';

    if (isContentsRequest) {
        // GetFile — return file binary content
        try {
            const filePath = Buffer.from(fileId, 'base64url').toString('utf-8');
            const fileBuffer = await storageService.downloadFile(filePath);

            return new NextResponse(new Uint8Array(fileBuffer), {
                status: 200,
                headers: {
                    'Content-Type': 'application/octet-stream',
                },
            });
        } catch (error) {
            console.error('WOPI GetFile error:', error);
            return NextResponse.json({ error: 'File not found' }, { status: 404 });
        }
    }

    // CheckFileInfo — return JSON metadata
    try {
        const filePath = Buffer.from(fileId, 'base64url').toString('utf-8');
        const filename = filePath.split('/').pop() || 'document.docx';
        const ext = filename.split('.').pop()?.toLowerCase() || 'docx';

        // Get file info from storage
        let fileSize = 0;
        try {
            const fileBuffer = await storageService.downloadFile(filePath);
            fileSize = fileBuffer.length;
        } catch {
            // File might not exist yet for new documents
        }

        const checkFileInfo = {
            BaseFileName: filename,
            OwnerId: tokenData.userId,
            Size: fileSize,
            UserId: tokenData.userId,
            UserFriendlyName: tokenData.userId,
            Version: Date.now().toString(),
            SupportsUpdate: true,
            UserCanWrite: true,
            UserCanNotWriteRelative: true,
            // Collabora-specific
            PostMessageOrigin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
            EnableOwnerTermination: true,
            DisablePrint: false,
            DisableExport: false,
            DisableCopy: false,
            // File extension for Collabora to pick correct editor
            FileExtension: `.${ext}`,
        };

        return NextResponse.json(checkFileInfo);
    } catch (error) {
        console.error('WOPI CheckFileInfo error:', error);
        return NextResponse.json({ error: 'Failed to get file info' }, { status: 500 });
    }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    const { path } = await params;

    // Extract access_token from query params
    const accessToken = request.nextUrl.searchParams.get('access_token');
    if (!accessToken) {
        return NextResponse.json({ error: 'Missing access token' }, { status: 401 });
    }

    const tokenData = verifyAccessToken(accessToken);
    if (!tokenData) {
        return NextResponse.json({ error: 'Invalid access token' }, { status: 401 });
    }

    if (path[0] !== 'files' || !path[1]) {
        return NextResponse.json({ error: 'Invalid WOPI request' }, { status: 404 });
    }

    const fileId = decodeURIComponent(path[1]);
    const isContentsRequest = path[2] === 'contents';

    // Check X-WOPI-Override header
    const wopiOverride = request.headers.get('X-WOPI-Override');

    if (isContentsRequest && (wopiOverride === 'PUT' || !wopiOverride)) {
        // PutFile — save file content from Collabora
        try {
            const filePath = Buffer.from(fileId, 'base64url').toString('utf-8');
            const fileBuffer = Buffer.from(await request.arrayBuffer());

            await storageService.uploadFile(filePath, fileBuffer);
            console.debug(`WOPI PutFile: saved ${filePath} (${fileBuffer.length} bytes)`);

            return new NextResponse(null, { status: 200 });
        } catch (error) {
            console.error('WOPI PutFile error:', error);
            return NextResponse.json({ error: 'Failed to save file' }, { status: 500 });
        }
    }

    return NextResponse.json({ error: 'Unknown WOPI operation' }, { status: 400 });
}
