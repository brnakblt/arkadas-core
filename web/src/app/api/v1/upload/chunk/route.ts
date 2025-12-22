import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const uploadId = formData.get('uploadId');
        const chunkIndex = formData.get('chunkIndex');
        const chunk = formData.get('chunk') as File;

        if (!uploadId || !chunk) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        // Ideally:
        // 1. Validate uploadId
        // 2. Write chunk to a temp folder named after uploadId
        //    path: /tmp/uploads/{uploadId}/{chunkIndex}

        // This requires access to fs, which works in Next.js Server Components / Route Handlers (Node.js runtime)

        return NextResponse.json({ success: true, index: chunkIndex });
    } catch {
        return NextResponse.json({ error: 'Chunk upload failed' }, { status: 500 });
    }
}
