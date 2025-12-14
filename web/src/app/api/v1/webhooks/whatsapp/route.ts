/**
 * WhatsApp Webhook
 * Receives incoming messages and status updates from WhatsApp
 */

import { NextRequest, NextResponse } from 'next/server';

const WEBHOOK_VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'arkadas_verify_token';

// GET - Webhook verification (required by WhatsApp)
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);

    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    if (mode === 'subscribe' && token === WEBHOOK_VERIFY_TOKEN) {
        console.log('WhatsApp webhook verified');
        return new NextResponse(challenge, { status: 200 });
    }

    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

// POST - Handle incoming messages and status updates
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Log the webhook payload
        console.log('WhatsApp webhook received:', JSON.stringify(body, null, 2));

        const entry = body.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;

        if (!value) {
            return NextResponse.json({ success: true });
        }

        // Handle incoming messages
        if (value.messages) {
            for (const message of value.messages) {
                await handleIncomingMessage(message, value.metadata);
            }
        }

        // Handle status updates
        if (value.statuses) {
            for (const status of value.statuses) {
                await handleStatusUpdate(status);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('WhatsApp webhook error:', error);
        return NextResponse.json({ success: true }); // Always return 200 to WhatsApp
    }
}

interface IncomingMessage {
    from: string;
    id: string;
    timestamp: string;
    type: string;
    text?: { body: string };
}

interface MessageMetadata {
    phone_number_id: string;
    display_phone_number: string;
}

async function handleIncomingMessage(message: IncomingMessage, metadata: MessageMetadata) {
    console.log(`New message from ${message.from}: ${message.text?.body || '[media]'}`);

    // TODO: Store message in database and/or forward to Nextcloud Talk
    // For now, just log it

    // You can implement auto-replies here
    // Example: Send to a chat or create a support ticket
}

interface StatusUpdate {
    id: string;
    status: 'sent' | 'delivered' | 'read' | 'failed';
    timestamp: string;
    recipient_id: string;
    errors?: { code: number; title: string }[];
}

async function handleStatusUpdate(status: StatusUpdate) {
    console.log(`Message ${status.id} status: ${status.status}`);

    if (status.status === 'failed' && status.errors) {
        console.error('Message delivery failed:', status.errors);
    }

    // TODO: Update message status in database
}
