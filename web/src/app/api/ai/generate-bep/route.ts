import { NextResponse } from 'next/server';
import { GoogleGenAI } from "@google/genai";
import { MEB_RULES } from '@/lib/mebRules';

// Initialize Gemini Client
// Server-side: prefer GEMINI_API_KEY, fallback to NEXT_PUBLIC_ if that's where it is
export async function POST(req: Request) {
    try {
        const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';

        if (!apiKey) {
            console.error("API Key missing");
            return NextResponse.json({ error: 'System configuration error: API Key missing' }, { status: 500 });
        }

        const ai = new GoogleGenAI({ apiKey });

        const body = await req.json();
        const { name, age, diagnosis, observations, strengths, needs } = body;

        if (!name || !diagnosis) {
            return NextResponse.json({ error: 'Name and Diagnosis are required' }, { status: 400 });
        }

        // Create a context string from MEB_RULES
        const rulesContext = JSON.stringify(MEB_RULES, null, 2);

        const systemPrompt = `
        Sen 'Arkadaş' Özel Eğitim ERP asistanı ve uzman bir özel eğitim öğretmenisin. 
        MEB (Milli Eğitim Bakanlığı) Özel Eğitim Hizmetleri Yönetmeliği'ne tam uyumlu BEP (Bireyselleştirilmiş Eğitim Planı) hazırlamalısın.
        
        Aşağıdaki MEB Kuralları ve Mevzuat bilgi bankasına sahipsin:
        ${rulesContext}

        Kurallar:
        1. Hedefler "SMART" (Özel, Ölçülebilir, Ulaşılabilir, Gerçekçi, Zaman Sınırlı) olmalıdır.
        2. Uzun dönemli hedefler, öğrencinin performans düzeyine uygun ve 1 yıllık kapsayıcı hedefler olmalıdır.
        3. Kısa dönemli hedefler, uzun dönemli hedefe ulaşmak için gerekli alt basamakları içermelidir.
        4. Yöntem ve teknikler, özel eğitimde geçerliliği kanıtlanmış (örn. Doğrudan Öğretim, Model Olma, Fiziksel Yardım) yöntemler olmalıdır.
        5. Dil kullanımın resmi, pedagojik ve teşvik edici olmalıdır.
        
        Çıktı Formatı (JSON):
        Aşağıdaki JSON şemasına birebir uyan geçerli bir JSON objesi döndür. Markdown formatlama KULLANMA.
        {
            "studentName": "${name}",
            "bepDate": "${new Date().toLocaleDateString('tr-TR')}",
            "performanceLevel": "Öğrencinin mevcut yapabildikleri, güçlü yönleri ve gelişimsel ihtiyaçlarını içeren ayrıntılı eğitsel performans özeti.",
            "longTermGoals": ["1. Hedef", "2. Hedef"],
            "shortTermGoals": ["1. Hedef için alt hedef", "2. Hedef için alt hedef"],
            "teachingMethods": ["Kullanılacak yöntemler listesi"],
            "materials": ["Gerekli eğitim materyalleri"],
            "evaluationMethods": ["Değerlendirme teknikleri"],
            "recommendations": ["Aileye ve öğretmenlere öneriler"]
        }
        `;

        const userPrompt = `
        Öğrenci: ${name}
        Yaş: ${age || 7}
        Tanı: ${diagnosis}
        
        Güçlü Yönler:
        ${Array.isArray(strengths) ? strengths.join(', ') : strengths || '-'}
        
        Gelişimsel İhtiyaçlar:
        ${Array.isArray(needs) ? needs.join(', ') : needs || '-'}

        Öğretmen Gözlemleri ve Notlar:
        ${observations}
        
        Lütfen bu öğrenci için MEB standartlarında, profesyonel bir BEP taslağı oluştur.
        `;

        const chat = ai.chats.create({
            model: 'gemini-2.0-flash-exp',
            config: {
                responseMimeType: 'application/json',
            }
        });

        const result = await chat.sendMessage({
            message: systemPrompt + "\n\n" + userPrompt
        });

        const responseText = result.text;

        if (!responseText) {
            throw new Error("Empty response from AI");
        }

        const data = JSON.parse(responseText.trim());

        return NextResponse.json(data);

    } catch (error) {
        console.error("BEP Generation API Error:", error);
        return NextResponse.json(
            { error: 'Failed to generate report' },
            { status: 500 }
        );
    }
}
