/**
 * File Shares API Route
 * Proxies requests to Strapi file-share endpoints
 */

import { NextRequest, NextResponse } from 'next/server';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://127.0.0.1:1337';

// GET /api/v1/shares - List user's shares
export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('Authorization');

        const response = await fetch(`${STRAPI_URL}/api/file-shares/mine`, {
            headers: {
                ...(authHeader && { Authorization: authHeader }),
            },
        });

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Shares list error:', error);
        return NextResponse.json(
            { success: false, error: 'Paylaşımlar listelenemedi' },
            { status: 500 }
        );
    }
}

// POST /api/v1/shares - Create share link
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const authHeader = request.headers.get('Authorization');

        const response = await fetch(`${STRAPI_URL}/api/file-shares/link`, {
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
        console.error('Create share error:', error);
        return NextResponse.json(
            { success: false, error: 'Paylaşım oluşturulamadı' },
            { status: 500 }
        );
    }
}
