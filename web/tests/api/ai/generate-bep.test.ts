
import { POST } from '@/app/api/ai/generate-bep/route';
import { NextRequest } from 'next/server';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Mock GoogleGenAI
vi.mock('@google/genai', () => {
    return {
        GoogleGenAI: class {
            chats = {
                create: vi.fn().mockReturnValue({
                    sendMessage: vi.fn().mockResolvedValue({
                        text: JSON.stringify({
                            studentName: "Test Student",
                            bepDate: "01.01.2026",
                            performanceLevel: "Test Level",
                            longTermGoals: ["Goal 1"],
                            shortTermGoals: ["Short 1"],
                            teachingMethods: ["Method 1"],
                            materials: ["Material 1"],
                            evaluationMethods: ["Eval 1"],
                            recommendations: ["Rec 1"]
                        })
                    })
                })
            };
        }
    };
});


const originalEnv = process.env;

beforeEach(() => {
    process.env = { ...originalEnv, GEMINI_API_KEY: 'test-key' };
});

afterEach(() => {
    process.env = originalEnv;
});

describe('POST /api/ai/generate-bep', () => {
    it('should return generated BEP data', async () => {
        const req = new NextRequest('http://localhost/api/ai/generate-bep', {
            method: 'POST',
            body: JSON.stringify({
                name: "Ali",
                age: 7,
                diagnosis: "Otizm"
            })
        });

        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.studentName).toBe("Test Student");
    });

    it('should return 400 if required fields are missing', async () => {
        const req = new NextRequest('http://localhost/api/ai/generate-bep', {
            method: 'POST',
            body: JSON.stringify({
                // Missing name
                age: 7
            })
        });

        const res = await POST(req);
        expect(res.status).toBe(400);
    });
});
