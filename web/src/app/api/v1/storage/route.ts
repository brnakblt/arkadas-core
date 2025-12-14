/**
 * Storage Files API Route
 * Proxies requests to Strapi storage-file endpoints
 */

import { NextRequest, NextResponse } from 'next/server';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://127.0.0.1:1337';

// GET /api/v1/storage - List user's files
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const path = searchParams.get('path') || '/';

        const authHeader = request.headers.get('Authorization');

        const response = await fetch(`${STRAPI_URL}/api/storage-files/mine?path=${encodeURIComponent(path)}`, {
            headers: {
                ...(authHeader && { Authorization: authHeader }),
            },
        });

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Storage list error:', error);
        return NextResponse.json(
            { success: false, error: 'Dosyalar listelenemedi' },
            { status: 500 }
        );
    }
}

// POST /api/v1/storage - Create folder
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const authHeader = request.headers.get('Authorization');

        const response = await fetch(`${STRAPI_URL}/api/storage-files/folder`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(authHeader && { Authorization: authHeader }),
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Create folder error:', error);
        return NextResponse.json(
            { success: false, error: 'Klasör oluşturulamadı' },
            { status: 500 }
        );
    }
}
