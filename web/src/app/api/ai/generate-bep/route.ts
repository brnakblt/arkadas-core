
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from "@google/genai";
import { BEP_SYSTEM_INSTRUCTION, constructBEPPrompt, StudentData } from '@/lib/bepPrompts';


export async function POST(req: NextRequest) {
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!apiKey) {
        return NextResponse.json(
            { error: 'Gemini API key is not configured' },
            { status: 500 }
        );
    }

    try {
        const body = await req.json();
        const { name, age, diagnosis, performanceLevel, strengths, needs, observations } = body;

        if (!name || !age || !diagnosis) {
            return NextResponse.json(
                { error: 'Missing required fields: name, age, diagnosis' },
                { status: 400 }
            );
        }

        const studentData: StudentData = {
            name,
            age,
            diagnosis,
            performanceLevel,
            strengths,
            needs,
            observations
        };

        const ai = new GoogleGenAI({ apiKey });
        const chat = ai.chats.create({
            model: 'gemini-2.0-flash-exp', // Using consistent model from tech stack
            config: {
                systemInstruction: BEP_SYSTEM_INSTRUCTION,
                responseMimeType: 'application/json',
            }
        });

        const prompt = constructBEPPrompt(studentData);
        
        let responseText;
        let retryCount = 0;
        const maxRetries = 3;

        while (retryCount < maxRetries) {
            try {
                const result = await chat.sendMessage({
                    message: prompt
                });
                responseText = result.text;
                if (responseText) break;
            } catch (e) {
                console.warn(`Attempt ${retryCount + 1} failed:`, e);
            }
            retryCount++;
            if (retryCount < maxRetries) {
                // Exponential backoff: 1s, 2s, 4s
                await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount - 1)));
            }
        }
        
        if (!responseText) {
            throw new Error('Empty response from AI after retries');
        }

        // Parse JSON to ensure it's valid before returning
        const bepData = JSON.parse(responseText);

        return NextResponse.json(bepData);

    } catch (error: any) {
        console.error('BEP Generation Error:', error);
        return NextResponse.json(
            { error: 'Failed to generate BEP', details: error.message },
            { status: 500 }
        );
    }
}
