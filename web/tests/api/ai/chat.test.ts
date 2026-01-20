
import { POST } from '@/app/api/ai/chat/route';
import { NextRequest } from 'next/server';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Mock GoogleGenAI
vi.mock('@google/genai', () => {
    return {
        GoogleGenAI: class {
            chats = {
                create: vi.fn().mockReturnValue({
                    sendMessage: vi.fn().mockResolvedValue({
                        text: 'Mock AI Response'
                    })
                })
            };
        }
    };
});

describe('Chat API', () => {
    let originalEnv: NodeJS.ProcessEnv;

    beforeEach(() => {
        originalEnv = process.env;
        process.env = { ...originalEnv, GEMINI_API_KEY: 'test-key' };
        vi.clearAllMocks();
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    it('should generate a response successfully', async () => {
        const req = new NextRequest('http://localhost:3000/api/ai/chat', {
            method: 'POST',
            body: JSON.stringify({
                message: 'Hello',
                history: []
            })
        });

        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toHaveProperty('text', 'Mock AI Response');
    });

    it('should return 400 if message is missing', async () => {
        const req = new NextRequest('http://localhost:3000/api/ai/chat', {
            method: 'POST',
            body: JSON.stringify({
                history: []
            })
        });

        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Message is required');
    });

    it('should return 500 if API key is missing', async () => {
        process.env.GEMINI_API_KEY = '';
        const req = new NextRequest('http://localhost:3000/api/ai/chat', {
            method: 'POST',
            body: JSON.stringify({
                message: 'Hello'
            })
        });

        const response = await POST(req);
        await response.json(); // It might return JSON error

        expect(response.status).toBe(500);
    });
});
