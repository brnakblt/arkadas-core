/**
 * MEBBIS API Proxy - Job Status
 * Get status of background jobs
 */

import { NextRequest, NextResponse } from 'next/server';

const MEBBIS_SERVICE_URL = process.env.MEBBIS_SERVICE_URL || 'http://localhost:4000';

interface RouteParams {
    params: Promise<{ jobId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { jobId } = await params;
        const { searchParams } = new URL(request.url);
        const queue = searchParams.get('queue') || '';

        const response = await fetch(
            `${MEBBIS_SERVICE_URL}/api/status/${jobId}?queue=${queue}`,
            { method: 'GET' }
        );

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('MEBBIS job status error:', error);
        return NextResponse.json(
            { success: false, error: 'MEBBIS servise bağlanılamadı' },
            { status: 503 }
        );
    }
}
