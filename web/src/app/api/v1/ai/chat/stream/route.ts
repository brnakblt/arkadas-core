/**
 * AI Chat Streaming API
 * Server-Sent Events (SSE) endpoint for streaming AI responses
 */

import { NextRequest } from 'next/server';

const AI_PROVIDER = process.env.AI_PROVIDER || 'openai'; // 'openai' | 'ollama' | 'anthropic'
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const AI_MODEL = process.env.AI_MODEL || 'gpt-4o-mini';

interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

interface ChatRequest {
    messages: ChatMessage[];
    model?: string;
    stream?: boolean;
}

export async function POST(request: NextRequest) {
    try {
        const body: ChatRequest = await request.json();
        const { messages, model = AI_MODEL } = body;

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return new Response(
                JSON.stringify({ success: false, error: 'Messages are required' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Add system prompt for Turkish education context
        const systemMessage: ChatMessage = {
            role: 'system',
            content: `Sen Arkadaş Özel Eğitim ve Rehabilitasyon Merkezi'nin yapay zeka asistanısın. 
Türkçe konuşuyorsun ve özel eğitim, rehabilitasyon, BEP formları, MEBBIS işlemleri konularında yardımcı oluyorsun.
Velilere ve öğretmenlere yardımcı ol, nazik ve profesyonel ol.`,
        };

        const fullMessages = [systemMessage, ...messages];

        // Create streaming response based on provider
        if (AI_PROVIDER === 'openai') {
            return streamOpenAI(fullMessages, model);
        } else if (AI_PROVIDER === 'ollama') {
            return streamOllama(fullMessages, model);
        } else {
            // Fallback: echo mode for testing
            return streamEcho(messages[messages.length - 1]?.content || '');
        }
    } catch (error) {
        console.error('AI chat error:', error);
        return new Response(
            JSON.stringify({ success: false, error: 'AI service unavailable' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}

/**
 * Stream from OpenAI API
 */
async function streamOpenAI(messages: ChatMessage[], model: string): Promise<Response> {
    if (!OPENAI_API_KEY) {
        return new Response(
            JSON.stringify({ success: false, error: 'OpenAI API key not configured' }),
            { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
            model,
            messages,
            stream: true,
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        console.error('OpenAI error:', error);
        return new Response(
            JSON.stringify({ success: false, error: 'OpenAI request failed' }),
            { status: 502, headers: { 'Content-Type': 'application/json' } }
        );
    }

    // Transform OpenAI stream to our SSE format
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const readable = new ReadableStream({
        async start(controller) {
            const reader = response.body?.getReader();
            if (!reader) {
                controller.close();
                return;
            }

            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value);
                    const lines = chunk.split('\n').filter(line => line.startsWith('data:'));

                    for (const line of lines) {
                        const data = line.replace('data: ', '').trim();
                        if (data === '[DONE]') {
                            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                            continue;
                        }

                        try {
                            const parsed = JSON.parse(data);
                            const content = parsed.choices?.[0]?.delta?.content || '';
                            if (content) {
                                controller.enqueue(
                                    encoder.encode(`data: ${JSON.stringify({ text: content })}\n\n`)
                                );
                            }
                        } catch {
                            // Skip invalid JSON
                        }
                    }
                }
            } finally {
                reader.releaseLock();
                controller.close();
            }
        },
    });

    return new Response(readable, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}

/**
 * Stream from Ollama (local LLM)
 */
async function streamOllama(messages: ChatMessage[], model: string): Promise<Response> {
    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model,
            messages,
            stream: true,
        }),
    });

    if (!response.ok) {
        return new Response(
            JSON.stringify({ success: false, error: 'Ollama request failed' }),
            { status: 502, headers: { 'Content-Type': 'application/json' } }
        );
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const readable = new ReadableStream({
        async start(controller) {
            const reader = response.body?.getReader();
            if (!reader) {
                controller.close();
                return;
            }

            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) {
                        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                        break;
                    }

                    const chunk = decoder.decode(value);
                    const lines = chunk.split('\n').filter(Boolean);

                    for (const line of lines) {
                        try {
                            const parsed = JSON.parse(line);
                            const content = parsed.message?.content || '';
                            if (content) {
                                controller.enqueue(
                                    encoder.encode(`data: ${JSON.stringify({ text: content })}\n\n`)
                                );
                            }
                        } catch {
                            // Skip invalid JSON
                        }
                    }
                }
            } finally {
                reader.releaseLock();
                controller.close();
            }
        },
    });

    return new Response(readable, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}

/**
 * Echo mode for testing (simulates streaming)
 */
async function streamEcho(message: string): Promise<Response> {
    const encoder = new TextEncoder();
    const words = `Bu bir test yanıtıdır. Mesajınız: "${message}"`.split(' ');

    const readable = new ReadableStream({
        async start(controller) {
            for (const word of words) {
                await new Promise(resolve => setTimeout(resolve, 100));
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: word + ' ' })}\n\n`));
            }
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
        },
    });

    return new Response(readable, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}
