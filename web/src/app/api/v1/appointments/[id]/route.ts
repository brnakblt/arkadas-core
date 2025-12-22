/**
 * Appointment Actions API
 * Cancel or confirm appointments
 */

import { NextRequest, NextResponse } from 'next/server';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// PUT /api/v1/appointments/[id] - Cancel appointment
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const authHeader = request.headers.get('authorization');
        const body = await request.json();
        const { action } = body; // 'cancel' or 'confirm'

        const endpoint = action === 'confirm'
            ? `${STRAPI_URL}/api/appointments/${id}/confirm`
            : `${STRAPI_URL}/api/appointments/${id}/cancel`;

        const response = await fetch(endpoint, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader || '',
            },
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(
                { success: false, error: data.error?.message || 'İşlem başarısız' },
                { status: response.status }
            );
        }

        return NextResponse.json({
            success: true,
            data: data,
        });
    } catch (error) {
        console.error('Error updating appointment:', error);
        return NextResponse.json(
            { success: false, error: 'İşlem başarısız' },
            { status: 500 }
        );
    }
}
