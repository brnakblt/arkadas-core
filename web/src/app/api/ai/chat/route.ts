
import { NextResponse } from 'next/server';
import { GoogleGenAI } from "@google/genai";
import { MEB_RULES } from '@/lib/mebRules';


export async function POST(req: Request) {
    try {
        const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
        const ai = new GoogleGenAI({ apiKey });

        const body = await req.json();
        const { history, message } = body;

        if (!message) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        if (!apiKey) {
            console.error("API Key missing");
            return NextResponse.json({ error: 'System configuration error: API Key missing' }, { status: 500 });
        }

        const rulesContext = JSON.stringify(MEB_RULES, null, 2);

        const systemInstruction = `
        Sen 'Arkadaş' Özel Eğitim ERP asistanısın. 
        Aşağıdaki MEB (Milli Eğitim Bakanlığı) Özel Eğitim Kuralları ve Mevzuat bilgi bankasına sahipsin:
        
        ${rulesContext}
        
        Kurallar:
        1. Kullanıcının sorularını bu bilgi bankasındaki kurallara göre net ve kesin yanıtla.
        2. Eğer soru MEB mevzuatı ile ilgiliyse, mutlaka ilgili kuralı veya süreyi belirt.
        3. Bilmediğin veya emin olmadığın konularda mevzuata bakman gerektiğini söyle, uydurma yanıt verme.
        4. Samimi, yardımsever ve profesyonel bir dil kullan.
        `;

        const chat = ai.chats.create({
            model: 'gemini-2.0-flash-exp',
            history: history || [],
            config: {
                systemInstruction: systemInstruction,
            }
        });

        const result = await chat.sendMessage({ message });
        const text = result.text;

        if (!text) {
            throw new Error("Empty response from AI");
        }

        return NextResponse.json({ text });

    } catch (error) {
        console.error("Chat API Error:", error);
        return NextResponse.json(
            { error: 'Failed to process chat message' },
            { status: 500 }
        );
    }
}
