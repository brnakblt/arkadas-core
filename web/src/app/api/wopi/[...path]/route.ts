import { NextRequest, NextResponse } from 'next/server';

// WOPI host implementation for OnlyOffice
// Standard: https://learn.microsoft.com/en-us/microsoft-365/cloud-storage-partner-program/rest/

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    // URL pattern: /api/wopi/files/{fileId}
    // params.path = ['files', 'fileId']

    const { path } = await params;
    const [resourceType, fileId] = path;

    if (resourceType !== 'files' || !fileId) {
        return NextResponse.json({ error: 'Invalid WOPI request' }, { status: 404 });
    }

    // CheckFileInfo
    // Returns JSON with file metadata: BaseFileName, OwnerId, Size, UserId, UserFriendlyName, etc.

    // Simulate fetching from Strapi
    const metadata = {
        BaseFileName: 'document.docx',
        OwnerId: 'uid-123',
        Size: 1024,
        UserId: 'uid-456',
        UserFriendlyName: 'Baran',
        Version: '1.0',
        SupportsUpdate: true,
        UserCanWrite: true,
        // OnlyOffice specific extensions can go here
    };

    return NextResponse.json(metadata);
}

export async function POST(request: NextRequest, { params: _params }: { params: Promise<{ path: string[] }> }) {
    // Handling contents update (PutFile) usually goes to /api/wopi/files/{id}/contents
    // but Next.js catch-all handles it.

    // Check X-WOPI-Override header
    const wopiOverride = request.headers.get('X-WOPI-Override');

    if (wopiOverride === 'PUT') {
        // Save file content
        // request.body contains the file stream
        return new NextResponse(null, { status: 200 });
    }

    return NextResponse.json({ error: 'Unknown operation' }, { status: 400 });
}
