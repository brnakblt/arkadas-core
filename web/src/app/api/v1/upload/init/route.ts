import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Use Map for in-memory session if Redis is overkill for now, but plan said Redis.
// We'll stick to in-memory/file-based for simplicity if Redis isn't set up in web container.
// Strapi/Web container usually has Redis. Let's assume Redis is available or stub it.
// For robust implementation, we'll store metadata in a way shared between calls.

export async function POST(request: NextRequest) {
    try {
        const { filename: _filename, size, mimeType: _mimeType, parentId: _parentId } = await request.json();
        const uploadId = crypto.randomUUID();
        const chunkSize = 5 * 1024 * 1024; // 5MB
        const totalChunks = Math.ceil(size / chunkSize);

        // In a real implementation, store this in Redis/DB
        // await redis.set(`upload:${uploadId}`, JSON.stringify({...}));

        // Returning the config to client
        return NextResponse.json({
            uploadId,
            chunkSize,
            totalChunks,
            uploadUrl: `/api/v1/upload/${uploadId}`, // Placeholder
        });
    } catch {
        return NextResponse.json({ error: 'Upload init failed' }, { status: 500 });
    }
}
