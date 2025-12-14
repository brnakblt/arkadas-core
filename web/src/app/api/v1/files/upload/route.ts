/**
 * File Upload API
 * POST /api/v1/files/upload - Upload a file to Nextcloud
 */

import { NextRequest, NextResponse } from 'next/server';
import { createNextcloudClient, uploadFile } from '@/lib/nextcloud';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const path = formData.get('path') as string || '/';

        if (!file) {
            return NextResponse.json(
                { success: false, error: 'No file provided' },
                { status: 400 }
            );
        }

        // Convert File to Buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Construct remote path
        const remotePath = path.endsWith('/')
            ? `${path}${file.name}`
            : `${path}/${file.name}`;

        const client = createNextcloudClient();
        await uploadFile(client, remotePath, buffer, {
            overwrite: true,
            contentType: file.type,
        });

        return NextResponse.json({
            success: true,
            message: 'File uploaded successfully',
            file: {
                name: file.name,
                size: file.size,
                type: file.type,
                path: remotePath,
            },
        });
    } catch (error) {
        console.error('Error uploading file:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to upload file' },
            { status: 500 }
        );
    }
}

export const config = {
    api: {
        bodyParser: false,
    },
};
