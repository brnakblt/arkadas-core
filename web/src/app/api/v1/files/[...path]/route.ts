/**
 * File Operations API - Download, Delete, Get Info
 * GET /api/v1/files/[...path] - Download file or get info
 * DELETE /api/v1/files/[...path] - Delete file
 */

import { NextRequest, NextResponse } from 'next/server';
import { createNextcloudClient, downloadFile, deleteFile, getFileInfo } from '@/lib/nextcloud';

interface RouteParams {
    params: Promise<{ path: string[] }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { path: pathSegments } = await params;
        const remotePath = '/' + pathSegments.join('/');
        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action') || 'download';

        const client = createNextcloudClient();

        if (action === 'info') {
            const info = await getFileInfo(client, remotePath);
            if (!info) {
                return NextResponse.json(
                    { success: false, error: 'File not found' },
                    { status: 404 }
                );
            }
            return NextResponse.json({ success: true, data: info });
        }

        // Download file
        const content = await downloadFile(client, remotePath);
        const info = await getFileInfo(client, remotePath);

        return new NextResponse(new Uint8Array(content), {
            headers: {
                'Content-Type': info?.mime || 'application/octet-stream',
                'Content-Disposition': `attachment; filename="${info?.basename || 'file'}"`,
                'Content-Length': content.length.toString(),
            },
        });
    } catch (error) {
        console.error('Error downloading file:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to download file' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { path: pathSegments } = await params;
        const remotePath = '/' + pathSegments.join('/');

        const client = createNextcloudClient();
        await deleteFile(client, remotePath);

        return NextResponse.json({
            success: true,
            message: 'File deleted successfully',
            path: remotePath,
        });
    } catch (error) {
        console.error('Error deleting file:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete file' },
            { status: 500 }
        );
    }
}
