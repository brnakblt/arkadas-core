/**
 * useAIChat Hook for Mobile
 * Handles streaming AI chat responses via SSE
 */

import { useState, useCallback, useRef } from 'react';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export interface ChatMessage {
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

        const userMessage: ChatMessage = {
            role: 'user',
            content: message,
            timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setResponse('');
        setError(null);
        setIsStreaming(true);

        abortControllerRef.current = new AbortController();

        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/ai/chat/stream`, {
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
                throw new Error('AI servisi kullanılamıyor');
            }

            // React Native doesn't support ReadableStream well, so we read as text
            const text = await res.text();
            const lines = text.split('\n').filter(line => line.startsWith('data:'));

            let fullResponse = '';
            for (const line of lines) {
                const data = line.replace('data: ', '').trim();
                if (data === '[DONE]') continue;

                try {
                    const parsed = JSON.parse(data);
                    if (parsed.text) {
                        fullResponse += parsed.text;
                    }
                } catch {
                    // Skip invalid JSON
                }
            }

            setResponse(fullResponse);

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
