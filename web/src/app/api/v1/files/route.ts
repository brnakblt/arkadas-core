/**
 * Files API - List and Create Operations
 * GET / - List files in a directory
 * POST / - Create a new directory
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createNextcloudClient, listFiles, createDirectory } from '@/lib/nextcloud';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const path = searchParams.get('path') || '/';

        const cookieStore = await cookies();
        const token = cookieStore.get('jwt')?.value;
        const _tenant_id = token ? 'authenticated-tenant' : 'arkadas';

        const client = createNextcloudClient();
        const files = await listFiles(client, path);

        return NextResponse.json({
            success: true,
            data: files,
            path,
        });
    } catch (error) {
        console.error('Error listing files:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to list files' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { path, type } = body;

        if (!path) {
            return NextResponse.json(
                { success: false, error: 'Path is required' },
                { status: 400 }
            );
        }

        const client = createNextcloudClient();

        if (type === 'directory') {
            await createDirectory(client, path);
            return NextResponse.json({
                success: true,
                message: 'Directory created successfully',
                path,
            });
        }

        return NextResponse.json(
            { success: false, error: 'Invalid operation' },
            { status: 400 }
        );
    } catch (error) {
        console.error('Error creating resource:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create resource' },
            { status: 500 }
        );
    }
}
