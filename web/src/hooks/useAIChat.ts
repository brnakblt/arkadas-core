/**
 * useAIChat Hook
 * Handles streaming AI chat responses with SSE
 */

"use client";

import { useState, useCallback, useRef } from 'react';

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp?: string;
}

interface UseAIChatReturn {
    messages: ChatMessage[];
    response: string;
    isStreaming: boolean;
    error: string | null;
    sendMessage: (message: string) => Promise<void>;
    clearMessages: () => void;
    stopStreaming: () => void;
}

export const useAIChat = (): UseAIChatReturn => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [response, setResponse] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    const sendMessage = useCallback(async (message: string) => {
        if (!message.trim() || isStreaming) return;

        // Add user message
        const userMessage: ChatMessage = {
            role: 'user',
            content: message,
            timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setResponse('');
        setError(null);
        setIsStreaming(true);

        // Create abort controller for cancellation
        abortControllerRef.current = new AbortController();

        try {
            const res = await fetch('/api/v1/ai/chat/stream', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [...messages, userMessage].map(m => ({
                        role: m.role,
                        content: m.content,
                    })),
                }),
                signal: abortControllerRef.current.signal,
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || 'AI servisi kullanılamıyor');
            }

            const reader = res.body?.getReader();
            const decoder = new TextDecoder();

            if (!reader) {
                throw new Error('Stream okunamadı');
            }

            let fullResponse = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n').filter(line => line.startsWith('data:'));

                for (const line of lines) {
                    const data = line.replace('data: ', '').trim();

                    if (data === '[DONE]') {
                        continue;
                    }

                    try {
                        const parsed = JSON.parse(data);
                        if (parsed.text) {
                            fullResponse += parsed.text;
                            setResponse(fullResponse);
                        }
                    } catch {
                        // Skip invalid JSON
                    }
                }
            }

            // Add assistant message to history
            if (fullResponse) {
                const assistantMessage: ChatMessage = {
                    role: 'assistant',
                    content: fullResponse,
                    timestamp: new Date().toISOString(),
                };
                setMessages((prev) => [...prev, assistantMessage]);
            }
        } catch (err) {
            if (err instanceof Error && err.name === 'AbortError') {
                // Cancelled by user
                setError('İptal edildi');
            } else {
                setError(err instanceof Error ? err.message : 'Bilinmeyen hata');
            }
        } finally {
            setIsStreaming(false);
            abortControllerRef.current = null;
        }
    }, [messages, isStreaming]);

    const clearMessages = useCallback(() => {
        setMessages([]);
        setResponse('');
        setError(null);
    }, []);

    const stopStreaming = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
    }, []);

    return {
        messages,
        response,
        isStreaming,
        error,
        sendMessage,
        clearMessages,
        stopStreaming,
    };
};

export default useAIChat;
