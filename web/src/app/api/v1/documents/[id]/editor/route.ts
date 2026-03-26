/**
 * Documents API - Get Collabora editor configuration
 * GET /api/v1/documents/[id]/editor - Get Collabora Online editor config via WOPI
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { generateAccessToken, getCollaboraEditorUrl, getWopiSrc } from '@/lib/collabora';

interface RouteParams {
    params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id: fileId } = await params;
        const { searchParams } = new URL(request.url);
        const _mode = searchParams.get('mode') as 'edit' | 'view' || 'edit';

        const cookieStore = await cookies();
        const jwt = cookieStore.get('jwt')?.value;
        const userId = jwt ? 'authenticated-user' : 'user-1';

        // Generate WOPI access token
        const accessToken = generateAccessToken(fileId, userId);

        // Build WOPI source URL (Collabora calls this to get file info/content)
        const wopiSrc = getWopiSrc(fileId);

        // Build the full Collabora editor URL
        const editorUrl = getCollaboraEditorUrl(wopiSrc, accessToken);

        return NextResponse.json({
            success: true,
            editorUrl,
            wopiSrc,
            accessToken,
        });
    } catch (error) {
        console.error('Error creating Collabora editor config:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create editor configuration' },
            { status: 500 }
        );
    }
}
