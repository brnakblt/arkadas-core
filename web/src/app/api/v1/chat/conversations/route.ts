/**
 * Conversations API
 * Manage Nextcloud Talk conversations
 */

import { NextRequest, NextResponse } from 'next/server';
import {
    getConversations,
    createConversation,
    getOrCreateOneToOne,
    ConversationType,
} from '@/lib/talk';

// GET /api/v1/chat/conversations - List all conversations
export async function GET() {
    try {
        const conversations = await getConversations();

        return NextResponse.json({
            success: true,
            data: conversations,
        });
    } catch (error) {
        console.error('Error fetching conversations:', error);
        return NextResponse.json(
            { success: false, error: 'Sohbetler yüklenemedi' },
            { status: 500 }
        );
    }
}

// POST /api/v1/chat/conversations - Create a new conversation
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { type, name, userId } = body;

        let conversation;

        if (type === 'one-to-one' && userId) {
            // Create or get 1-on-1 conversation
            conversation = await getOrCreateOneToOne(userId);
        } else if (type === 'group' && name) {
            // Create group conversation
            conversation = await createConversation(ConversationType.GROUP, name);
        } else {
            return NextResponse.json(
                { success: false, error: 'Geçersiz parametreler' },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            data: conversation,
        });
    } catch (error) {
        console.error('Error creating conversation:', error);
        return NextResponse.json(
            { success: false, error: 'Sohbet oluşturulamadı' },
            { status: 500 }
        );
    }
}
