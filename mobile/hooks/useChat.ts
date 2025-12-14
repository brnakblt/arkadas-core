/**
 * useChat Hook for Mobile
 * Manages conversations and messages from Nextcloud Talk
 */

import { useState, useEffect, useCallback, useRef } from 'react';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export interface Conversation {
    token: string;
    displayName: string;
    unreadMessages: number;
    lastMessage?: Message;
}

export interface Message {
    id: number;
    actorDisplayName: string;
    message: string;
    timestamp: number;
    systemMessage: string;
}

interface UseChatReturn {
    conversations: Conversation[];
    currentConversation: Conversation | null;
    messages: Message[];
    isLoading: boolean;
    error: string | null;
    loadConversations: () => Promise<void>;
    selectConversation: (token: string) => Promise<void>;
    sendMessage: (message: string) => Promise<void>;
}

export const useChat = (pollInterval: number = 3000): UseChatReturn => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const lastMessageIdRef = useRef<number | null>(null);
    const pollRef = useRef<NodeJS.Timeout | null>(null);

    const loadConversations = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/chat/conversations`);
            const data = await res.json();
            if (data.success) {
                setConversations(data.data || []);
            }
        } catch (err) {
            setError('Sohbetler yüklenemedi');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const loadMessages = useCallback(async (token: string, lastId?: number) => {
        try {
            const params = new URLSearchParams();
            if (lastId) params.set('lastMessageId', lastId.toString());

            const res = await fetch(`${API_BASE_URL}/api/v1/chat/conversations/${token}?${params}`);
            const data = await res.json();

            if (data.success) {
                const newMsgs = data.data.messages || [];
                if (lastId) {
                    setMessages((prev) => [...prev, ...newMsgs]);
                } else {
                    setMessages(newMsgs);
                }
                if (newMsgs.length) {
                    lastMessageIdRef.current = newMsgs[newMsgs.length - 1].id;
                }
                if (data.data.conversation) {
                    setCurrentConversation(data.data.conversation);
                }
            }
        } catch (err) {
            console.error(err);
        }
    }, []);

    const selectConversation = useCallback(async (token: string) => {
        setIsLoading(true);
        setMessages([]);
        lastMessageIdRef.current = null;

        // Clear existing poll
        if (pollRef.current) clearInterval(pollRef.current);

        await loadMessages(token);
        setIsLoading(false);

        // Start polling
        pollRef.current = setInterval(() => {
            if (lastMessageIdRef.current) {
                loadMessages(token, lastMessageIdRef.current);
            }
        }, pollInterval);
    }, [loadMessages, pollInterval]);

    const sendMessage = useCallback(async (message: string) => {
        if (!currentConversation) return;

        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/chat/conversations/${currentConversation.token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message }),
            });
            const data = await res.json();
            if (data.success && data.data) {
                setMessages((prev) => [...prev, data.data]);
                lastMessageIdRef.current = data.data.id;
            }
        } catch (err) {
            setError('Mesaj gönderilemedi');
        }
    }, [currentConversation]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, []);

    return {
        conversations,
        currentConversation,
        messages,
        isLoading,
        error,
        loadConversations,
        selectConversation,
        sendMessage,
    };
};

export default useChat;
