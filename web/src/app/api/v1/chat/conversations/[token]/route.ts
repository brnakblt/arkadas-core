/**
 * Conversation Details API
 * Get, update, or delete a specific conversation
 */

import { NextRequest, NextResponse } from 'next/server';
import {
    getConversation,
    getMessages,
    sendMessage,
    markConversationRead,
    leaveConversation,
} from '@/lib/talk';

interface RouteParams {
    params: Promise<{ token: string }>;
}

// GET /api/v1/chat/conversations/[token] - Get conversation with messages
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { token } = await params;
        const { searchParams } = new URL(request.url);
        const lastMessageId = searchParams.get('lastMessageId');
        const limit = searchParams.get('limit');

        // Get conversation details
        const conversation = await getConversation(token);

        // Get messages
        const messages = await getMessages(token, {
            limit: limit ? parseInt(limit) : 50,
            lastKnownMessageId: lastMessageId ? parseInt(lastMessageId) : undefined,
            lookIntoFuture: lastMessageId ? 1 : 0,
        });

        return NextResponse.json({
            success: true,
            data: {
                conversation,
                messages,
            },
        });
    } catch (error) {
        console.error('Error fetching conversation:', error);
        return NextResponse.json(
            { success: false, error: 'Sohbet yüklenemedi' },
            { status: 500 }
        );
    }
}

// POST /api/v1/chat/conversations/[token] - Send a message
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { token } = await params;
        const body = await request.json();
        const { message, replyTo } = body;

        if (!message || typeof message !== 'string') {
            return NextResponse.json(
                { success: false, error: 'Mesaj gerekli' },
                { status: 400 }
            );
        }

        const sentMessage = await sendMessage(token, message, replyTo);

        return NextResponse.json({
            success: true,
            data: sentMessage,
        });
    } catch (error) {
        console.error('Error sending message:', error);
        return NextResponse.json(
            { success: false, error: 'Mesaj gönderilemedi' },
            { status: 500 }
        );
    }
}

// PUT /api/v1/chat/conversations/[token] - Mark as read
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { token } = await params;

        await markConversationRead(token);

        return NextResponse.json({
            success: true,
            message: 'Sohbet okundu olarak işaretlendi',
        });
    } catch (error) {
        console.error('Error marking conversation read:', error);
        return NextResponse.json(
            { success: false, error: 'İşlem başarısız' },
            { status: 500 }
        );
    }
}

// DELETE /api/v1/chat/conversations/[token] - Leave conversation
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { token } = await params;

        await leaveConversation(token);

        return NextResponse.json({
            success: true,
            message: 'Sohbetten ayrıldınız',
        });
    } catch (error) {
        console.error('Error leaving conversation:', error);
        return NextResponse.json(
            { success: false, error: 'Sohbetten ayrılamadı' },
            { status: 500 }
        );
    }
}
