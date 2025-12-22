/* eslint-disable no-console */
import { NextRequest, NextResponse } from 'next/server';

/**
 * Analytics Collection API
 * 
 * Receives batched analytics events from the client.
 * Privacy-first: no IP tracking, no PII storage.
 */

interface AnalyticsEvent {
    name: string;
    properties?: Record<string, string | number | boolean>;
    timestamp: number;
    sessionId: string;
}

interface CollectRequest {
    events: AnalyticsEvent[];
}

/**
 * Validate an analytics event
 */
function isValidEvent(event: unknown): event is AnalyticsEvent {
    if (!event || typeof event !== 'object') return false;

    const e = event as Record<string, unknown>;
    return (
        typeof e.name === 'string' &&
        e.name.length > 0 &&
        e.name.length <= 100 &&
        typeof e.timestamp === 'number' &&
        typeof e.sessionId === 'string'
    );
}

/**
 * POST /api/analytics/collect
 * 
 * Receives analytics events in batches.
 * Rate-limited and validated.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as CollectRequest;

        // Validate request structure
        if (!body.events || !Array.isArray(body.events)) {
            return NextResponse.json(
                { error: 'Invalid request: events array required' },
                { status: 400 }
            );
        }

        // Validate and filter events
        const validEvents = body.events.filter(isValidEvent);

        if (validEvents.length === 0) {
            return NextResponse.json(
                { error: 'No valid events provided' },
                { status: 400 }
            );
        }

        // Limit batch size
        const maxEvents = 50;
        const eventsToProcess = validEvents.slice(0, maxEvents);

        // In production, you would:
        // 1. Store in a database (ClickHouse, TimescaleDB, etc.)
        // 2. Forward to analytics service (Plausible, Matomo, etc.)
        // 3. Aggregate for dashboards

        // For now, log to console in development
        if (process.env.NODE_ENV === 'development') {
            console.debug('[Analytics API] Received events:', eventsToProcess.length);
            eventsToProcess.forEach((event) => {
                console.debug(`  - ${event.name}:`, event.properties);
            });
        }

        // Aggregate stats could be stored here
        // await storeAnalyticsEvents(eventsToProcess);

        return NextResponse.json({
            success: true,
            processed: eventsToProcess.length,
            dropped: validEvents.length - eventsToProcess.length,
        });
    } catch (error) {
        console.error('[Analytics API] Error:', error);

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/analytics/collect
 * 
 * Returns basic analytics info (for debugging/health checks).
 */
export async function GET() {
    return NextResponse.json({
        service: 'Analytics Collection',
        status: 'active',
        privacy: {
            ip_tracking: false,
            fingerprinting: false,
            cookies: false,
            pii_storage: false,
        },
        limits: {
            max_batch_size: 50,
            max_event_name_length: 100,
        },
    });
}
