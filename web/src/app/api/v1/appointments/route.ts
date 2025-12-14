/**
 * Appointments API Proxy
 * Proxies requests to Strapi for appointment management
 */

import { NextRequest, NextResponse } from 'next/server';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

// GET /api/v1/appointments - Get user's appointments
export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');

        const response = await fetch(`${STRAPI_URL}/api/appointments/mine`, {
            headers: {
                'Authorization': authHeader || '',
            },
        });

        const data = await response.json();

        return NextResponse.json({
            success: true,
            data: data,
        });
    } catch (error) {
        console.error('Error fetching appointments:', error);
        return NextResponse.json(
            { success: false, error: 'Randevular yüklenemedi' },
            { status: 500 }
        );
    }
}

// POST /api/v1/appointments - Book an appointment
export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        const body = await request.json();

        const response = await fetch(`${STRAPI_URL}/api/appointments/book`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader || '',
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(
                { success: false, error: data.error?.message || 'Randevu oluşturulamadı' },
                { status: response.status }
            );
        }

        return NextResponse.json({
            success: true,
            data: data,
        });
    } catch (error) {
        console.error('Error booking appointment:', error);
        return NextResponse.json(
            { success: false, error: 'Randevu oluşturulamadı' },
            { status: 500 }
        );
    }
}
