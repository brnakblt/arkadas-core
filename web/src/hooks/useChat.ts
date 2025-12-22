/**
 * useChat Hook
 * Manages chat conversations and real-time message polling
 */

"use client";

import { useState, useEffect, useCallback, useRef } from 'react';

interface Conversation {
    token: string;
    name: string;
    displayName: string;
    type: number;
    unreadMessages: number;
    lastMessage?: Message;
}

interface Message {
    id: number;
    token: string;
    actorType: string;
    actorId: string;
    actorDisplayName: string;
    timestamp: number;
    message: string;
    systemMessage: string;
    isReplyable: boolean;
}

interface UseChatReturn {
    conversations: Conversation[];
    currentConversation: Conversation | null;
    messages: Message[];
    isLoading: boolean;
    isPolling: boolean;
    error: string | null;
    loadConversations: () => Promise<void>;
    selectConversation: (token: string) => Promise<void>;
    sendMessage: (message: string, replyTo?: number) => Promise<void>;
    createOneToOne: (userId: string) => Promise<Conversation | null>;
    markAsRead: () => Promise<void>;
}

export const useChat = (pollInterval: number = 3000): UseChatReturn => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isPolling, setIsPolling] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const lastMessageIdRef = useRef<number | null>(null);
    const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const loadConversations = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/v1/chat/conversations');
            const data = await response.json();

            if (data.success) {
                setConversations(data.data || []);
            } else {
                throw new Error(data.error);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Sohbetler yüklenemedi');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const loadMessages = useCallback(async (token: string, lastId?: number) => {
        try {
            const params = new URLSearchParams();
            if (lastId) params.set('lastMessageId', lastId.toString());
            params.set('limit', '50');

            const response = await fetch(`/api/v1/chat/conversations/${token}?${params}`);
            const data = await response.json();

            if (data.success) {
                const newMessages = data.data.messages || [];

                if (lastId) {
                    // Append new messages
                    setMessages((prev) => [...prev, ...newMessages]);
                } else {
                    // Replace all messages
                    setMessages(newMessages);
                }

                // Update last message ID for polling
                if (newMessages.length > 0) {
                    lastMessageIdRef.current = newMessages[newMessages.length - 1].id;
                }

                // Update conversation with latest data
                if (data.data.conversation) {
                    setCurrentConversation(data.data.conversation);
                }
            }
        } catch (err) {
            console.error('Error loading messages:', err);
        }
    }, []);

    const selectConversation = useCallback(async (token: string) => {
        setIsLoading(true);
        setMessages([]);
        lastMessageIdRef.current = null;

        try {
            await loadMessages(token);
            setIsPolling(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Sohbet yüklenemedi');
        } finally {
            setIsLoading(false);
        }
    }, [loadMessages]);

    const sendMessage = useCallback(async (message: string, replyTo?: number) => {
        if (!currentConversation) return;

        try {
            const response = await fetch(`/api/v1/chat/conversations/${currentConversation.token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message, replyTo }),
            });

            const data = await response.json();

            if (data.success && data.data) {
                setMessages((prev) => [...prev, data.data]);
                lastMessageIdRef.current = data.data.id;
            } else {
                throw new Error(data.error);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Mesaj gönderilemedi');
        }
    }, [currentConversation]);

    const createOneToOne = useCallback(async (userId: string): Promise<Conversation | null> => {
        try {
            const response = await fetch('/api/v1/chat/conversations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'one-to-one', userId }),
            });

            const data = await response.json();

            if (data.success) {
                await loadConversations();
                return data.data;
            }
            return null;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Sohbet oluşturulamadı');
            return null;
        }
    }, [loadConversations]);

    const markAsRead = useCallback(async () => {
        if (!currentConversation) return;

        try {
            await fetch(`/api/v1/chat/conversations/${currentConversation.token}`, {
                method: 'PUT',
            });
        } catch (err) {
            console.error('Error marking as read:', err);
        }
    }, [currentConversation]);

    // Polling for new messages
    useEffect(() => {
        if (isPolling && currentConversation) {
            pollIntervalRef.current = setInterval(() => {
                if (lastMessageIdRef.current) {
                    loadMessages(currentConversation.token, lastMessageIdRef.current);
                }
            }, pollInterval);
        }

        return () => {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
            }
        };
    }, [isPolling, currentConversation, pollInterval, loadMessages]);

    // Stop polling when conversation changes
    useEffect(() => {
        return () => {
            setIsPolling(false);
        };
    }, [currentConversation?.token]);

    return {
        conversations,
        currentConversation,
        messages,
        isLoading,
        isPolling,
        error,
        loadConversations,
        selectConversation,
        sendMessage,
        createOneToOne,
        markAsRead,
    };
};

export default useChat;
