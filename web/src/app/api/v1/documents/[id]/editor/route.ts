/**
 * Documents API - Get editor configuration
 * GET /api/v1/documents/[id]/editor - Get OnlyOffice editor config
 */

import { NextRequest, NextResponse } from 'next/server';
import { createEditorConfig, getDocumentServerUrl } from '@/lib/onlyoffice';
import { createNextcloudClient, getFileInfo } from '@/lib/nextcloud';

interface RouteParams {
    params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id: fileId } = await params;
        const { searchParams } = new URL(request.url);
        const mode = searchParams.get('mode') as 'edit' | 'view' || 'edit';

        // Decode the file path from the ID (base64 encoded)
        const filePath = Buffer.from(fileId, 'base64url').toString('utf-8');

        // Get file info from Nextcloud
        const client = createNextcloudClient();
        const fileInfo = await getFileInfo(client, filePath);

        if (!fileInfo) {
            return NextResponse.json(
                { success: false, error: 'File not found' },
                { status: 404 }
            );
        }

        // TODO: Get actual user from session
        const userId = 'user-1';
        const userName = 'Admin';

        // Create file URL that OnlyOffice can access
        // In production, this should be an accessible URL
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const encodedPath = encodeURIComponent(filePath.slice(1)); // Remove leading /
        const fileUrl = `${appUrl}/api/v1/files/${encodedPath}`;

        const config = createEditorConfig({
            fileId,
            filename: fileInfo.basename,
            fileUrl,
            userId,
            userName,
            lastModified: fileInfo.lastmod,
            mode,
        });

        return NextResponse.json({
            success: true,
            documentServerUrl: getDocumentServerUrl(),
            config,
        });
    } catch (error) {
        console.error('Error creating editor config:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create editor configuration' },
            { status: 500 }
        );
    }
}
