
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
// Client-side usage requires NEXT_PUBLIC_ prefix or API route proxy
// For security, ideally this should be a server actio or API route, 
// but for this migration we keep it client-side as requested in temp.

const getClient = () => new GoogleGenAI({ apiKey });

export const sendChatMessage = async (history: Record<string, unknown>[], message: string) => {
    try {
        const response = await fetch('/api/ai/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                history,
                message,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to send message');
        }

        const data = await response.json();
        return data.text;
    } catch (error) {
        console.error("Chat Service Error:", error);
        return "Üzgünüm, şu anda yanıt veremiyorum. Lütfen daha sonra tekrar deneyin.";
    }
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


export const generateMaterial = async (type: 'story' | 'worksheet', topic: string, level: string, studentInfo?: string) => {
    try {
        const response = await fetch('/api/ai/generate-material', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ type, topic, level, studentInfo }),
        });

        if (!response.ok) {
            throw new Error('Failed to generate material');
        }

        const data = await response.json();
        return data.content;
    } catch (error) {
        console.error("Material Service Error:", error);
        throw error;
    }
};

export const generateEducationalImage = async (prompt: string, size: '1K' | '2K' | '4K' = '1K') => {
    // Placeholder for Image Generation as it requires specific models/APIs
    // Returning a mock URL or real implementation if available
    // eslint-disable-next-line no-console
    console.log("Image generation requested:", prompt, size);
    return null;
};

export const speakText = async (text: string) => {
    // Placeholder for TTS
    // eslint-disable-next-line no-console
    console.log("TTS requested:", text);
    return null;
};

// eslint-disable-next-line no-undef
export const playAudioBuffer = (buffer: AudioBuffer) => {
    if (typeof window === 'undefined') return;
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const audioContext = new AudioContextClass();
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start();
};

