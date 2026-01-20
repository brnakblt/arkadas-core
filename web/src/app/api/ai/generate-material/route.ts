
import { NextResponse } from 'next/server';
import { GoogleGenAI } from "@google/genai";
import { MEB_RULES } from '@/lib/mebRules';

export async function POST(req: Request) {
    try {
        const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
        const ai = new GoogleGenAI({ apiKey });

        const body = await req.json();
        const { type, topic, level, studentInfo } = body;

        if (!topic || !level || !type) {
            return NextResponse.json({ error: 'Topic, Level and Type are required' }, { status: 400 });
        }

        if (!apiKey) {
            console.error("API Key missing");
            return NextResponse.json({ error: 'System configuration error: API Key missing' }, { status: 500 });
        }

        const rulesContext = JSON.stringify(MEB_RULES, null, 2);

        let systemPrompt = `
        Sen 'Arkadaş' Özel Eğitim ERP sistemi için eğitim materyali üreten uzman bir eğitimcisin.
        MEB (Milli Eğitim Bakanlığı) müfredatına ve pedagojik ilkelerine uygun içerik üretmelisin.
        
        Hedef Kitle Seviyesi: ${level}
        Konu: ${topic}
        Öğrenci Bilgisi (Varsa): ${studentInfo || 'Belirtilmedi'}
        
        Kurallar:
        1. Dil seviyesi hedef kitleye tam uygun olmalı.
        2. İçerik pozitif, kapsayıcı ve teşvik edici olmalı.
        3. ${type === 'story' ? 'Hikaye kurgusu ilgi çekici olmalı ve somut kavramlar içermeli.' : 'Sorular açık, anlaşılır ve ölçülebilir olmalı.'}
        `;

        let userPrompt = "";

        if (type === 'story') {
            userPrompt = `
            Lütfen "${topic}" konusuyla ilgili, ${level} seviyesindeki bir öğrenci için kısa bir hikaye yaz.
            Hikayeden sonra, okuduğunu anlama için 3 adet basit soru ekle.
            Çıktı Formatı: Markdown
            `;
        } else if (type === 'worksheet') {
            userPrompt = `
            Lütfen "${topic}" konusuyla ilgili, ${level} seviyesindeki bir öğrenci için bir çalışma kağıdı hazırla.
            İçerik:
            - 5 adet boşluk doldurma sorusu
            - 5 adet çoktan seçmeli soru (3 şıklı)
            - Cevap anahtarı en altta olsun.
            Çıktı Formatı: Markdown
            `;
        } else {
            return NextResponse.json({ error: 'Invalid material type' }, { status: 400 });
        }

        const chat = ai.chats.create({
            model: 'gemini-2.0-flash-exp',
            config: {
                systemInstruction: systemPrompt,
            }
        });

        const result = await chat.sendMessage({ message: userPrompt });
        const text = result.text;

        if (!text) {
            throw new Error("Empty response from AI");
        }

        return NextResponse.json({ content: text });

    } catch (error) {
        console.error("Material Generation API Error:", error);
        return NextResponse.json(
            { error: 'Failed to generate material' },
            { status: 500 }
        );
    }
}
