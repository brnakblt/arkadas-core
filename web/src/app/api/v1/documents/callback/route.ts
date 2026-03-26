/**
 * Document Save Callback API
 * 
 * With Collabora Online, document saves are handled directly via the WOPI
 * PutFile endpoint (/api/wopi/files/{id}/contents). This callback route is
 * kept as a lightweight endpoint for any custom save notifications or 
 * post-save hooks (e.g. audit logging, cache invalidation).
 * 
 * Collabora saves flow:
 * 1. User edits document in Collabora iframe
 * 2. Collabora calls POST /api/wopi/files/{id}/contents (PutFile) 
 * 3. WOPI route saves file to storage via storageService
 * 
 * This route can be called by your app after a WOPI save completes
 * for additional processing.
 */

/* eslint-disable no-console */
import { NextRequest, NextResponse } from 'next/server';

interface DocumentSaveNotification {
    fileId: string;
    filePath?: string;
    userId?: string;
    action: 'saved' | 'closed';
    timestamp?: string;
}

export async function POST(request: NextRequest) {
    try {
        const body: DocumentSaveNotification = await request.json();

        console.debug('Document save notification received:', JSON.stringify(body, null, 2));

        const { fileId, action } = body;

        switch (action) {
            case 'saved':
                console.debug(`Document ${fileId} saved successfully`);
                // Add post-save hooks here: audit logging, cache invalidation, etc.
                break;

            case 'closed':
                console.debug(`Document ${fileId} editing session closed`);
                break;

            default:
                console.warn(`Unknown document action: ${action}`);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error processing document callback:', error);
        return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
    }
}
