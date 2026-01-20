
import { GoogleGenAI, Modality } from "@google/genai";

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
// Client-side usage requires NEXT_PUBLIC_ prefix or API route proxy
// For security, ideally this should be a server actio or API route, 
// but for this migration we keep it client-side as requested in temp.

const getClient = () => new GoogleGenAI({ apiKey });

import { MEB_RULES } from '@/lib/mebRules';

export const sendChatMessage = async (history: any[], message: string) => {
    const ai = getClient();

    // Create a knowledge base string from MEB_RULES
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
        history: history,
        config: {
            systemInstruction: systemInstruction,
        }
    });

    const result = await chat.sendMessage({ message });
    return result.text;
};

export interface BEPData {
    studentName: string;
    bepDate: string;
    performanceLevel: string;
    longTermGoals: string[];
    shortTermGoals: string[];
    teachingMethods: string[];
    materials: string[];
    evaluationMethods: string[];
    recommendations: string[];
}

export const generateBEPReport = async (
    studentName: string,
    diagnosis: string,
    observations: string,
    age: number = 7 // Default age if not provided
): Promise<BEPData | null> => {
    const ai = getClient();

    const systemPrompt = `
    Sen 'Arkadaş' Özel Eğitim ERP asistanı ve uzman bir özel eğitim öğretmenisin. 
    MEB (Milli Eğitim Bakanlığı) Özel Eğitim Hizmetleri Yönetmeliği'ne tam uyumlu BEP (Bireyselleştirilmiş Eğitim Planı) hazırlamalısın.
    
    Kurallar:
    1. Hedefler "SMART" (Özel, Ölçülebilir, Ulaşılabilir, Gerçekçi, Zaman Sınırlı) olmalıdır.
    2. Uzun dönemli hedefler, öğrencinin performans düzeyine uygun ve 1 yıllık kapsayıcı hedefler olmalıdır.
    3. Kısa dönemli hedefler, uzun dönemli hedefe ulaşmak için gerekli alt basamakları içermelidir.
    4. Yöntem ve teknikler, özel eğitimde geçerliliği kanıtlanmış (örn. Doğrudan Öğretim, Model Olma, Fiziksel Yardım) yöntemler olmalıdır.
    5. Dil kullanımın resmi, pedagojik ve teşvik edici olmalıdır.
    
    Çıktı Formatı (JSON):
    Aşağıdaki JSON şemasına birebir uyan geçerli bir JSON objesi döndür. Markdown formatlama KULLANMA.
    {
        "studentName": "${studentName}",
        "bepDate": "${new Date().toLocaleDateString('tr-TR')}",
        "performanceLevel": "Öğrencinin mevcut yapabildikleri ve zorlandıkları alanların ayrıntılı eğitsel performans özeti.",
        "longTermGoals": ["1. Hedef", "2. Hedef"],
        "shortTermGoals": ["1. Hedef için alt hedef", "2. Hedef için alt hedef"],
        "teachingMethods": ["Kullanılacak yöntemler listesi"],
        "materials": ["Gerekli eğitim materyalleri"],
        "evaluationMethods": ["Değerlendirme teknikleri"],
        "recommendations": ["Aileye ve öğretmenlere öneriler"]
    }
    `;

    const userPrompt = `
    Öğrenci: ${studentName}
    Yaş: ${age}
    Tanı: ${diagnosis}
    
    Öğretmen Gözlemleri ve Notlar:
    ${observations}
    
    Lütfen bu öğrenci için MEB standartlarında, profesyonel bir BEP taslağı oluştur.
    `;

    try {
        const chat = ai.chats.create({
            model: 'gemini-2.0-flash-exp',
            config: {
                responseMimeType: 'application/json', // Force JSON output
            }
        });

        const result = await chat.sendMessage({
            message: systemPrompt + "\n\n" + userPrompt
        });

        const responseText = result.text;
        if (!responseText) return null;
        return JSON.parse(responseText) as BEPData;
    } catch (error) {
        console.error("BEP Generation Error:", error);
        return null;
    }
};

export const generateEducationalImage = async (prompt: string, size: '1K' | '2K' | '4K' = '1K') => {
    // Placeholder for Image Generation as it requires specific models/APIs
    // Returning a mock URL or real implementation if available
    console.log("Image generation requested:", prompt, size);
    return null;
};

export const speakText = async (text: string) => {
    // Placeholder for TTS
    console.log("TTS requested:", text);
    return null;
};

export const playAudioBuffer = (buffer: AudioBuffer) => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start();
};
