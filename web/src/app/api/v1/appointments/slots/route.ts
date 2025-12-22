/**
 * Available Slots API
 * Get available appointment time slots for a teacher
 */

import { NextRequest, NextResponse } from 'next/server';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const teacherId = searchParams.get('teacherId');
        const date = searchParams.get('date');

        if (!teacherId || !date) {
            return NextResponse.json(
                { success: false, error: 'teacherId ve date gerekli' },
                { status: 400 }
            );
        }

        const response = await fetch(
            `${STRAPI_URL}/api/appointments/available-slots?teacherId=${teacherId}&date=${date}`
        );

        const data = await response.json();

        return NextResponse.json({
            success: true,
            data: data,
        });
    } catch (error) {
        console.error('Error fetching slots:', error);
        return NextResponse.json(
            { success: false, error: 'Zaman dilimleri yüklenemedi' },
            { status: 500 }
        );
    }
}
