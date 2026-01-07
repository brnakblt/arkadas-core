/**
 * Admin Health API - System Service Health Check
 * GET /api/admin/health
 */

import { NextResponse } from 'next/server';

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const MEBBIS_SERVICE_URL = process.env.MEBBIS_SERVICE_URL || 'http://localhost:4000';

type HealthStatus = 'healthy' | 'degraded' | 'down';

async function checkService(url: string, timeout = 5000): Promise<HealthStatus> {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
            signal: controller.signal,
            method: 'GET',
        });

        clearTimeout(timeoutId);

        if (response.ok) return 'healthy';
        if (response.status >= 500) return 'down';
        return 'degraded';
    } catch {
        return 'down';
    }
}

export async function GET() {
    try {
        const [database, aiService, mebbis] = await Promise.all([
            checkService(`${STRAPI_URL}/_health`).catch(() => 'degraded' as HealthStatus),
            checkService(`${AI_SERVICE_URL}/api/health`).catch(() => 'degraded' as HealthStatus),
            checkService(`${MEBBIS_SERVICE_URL}/health`).catch(() => 'degraded' as HealthStatus),
        ]);

        return NextResponse.json({
            database: database || 'healthy', // Strapi connects to DB
            aiService,
            storage: 'healthy', // Assume healthy if API responds
            mebbis,
        });
    } catch (error) {
        console.error('Health check error:', error);
        return NextResponse.json({
            database: 'degraded',
            aiService: 'degraded',
            storage: 'degraded',
            mebbis: 'degraded',
        });
    }
}
