
import { GoogleGenAI, Modality } from "@google/genai";

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
// Client-side usage requires NEXT_PUBLIC_ prefix or API route proxy
// For security, ideally this should be a server actio or API route, 
// but for this migration we keep it client-side as requested in temp.

const getClient = () => new GoogleGenAI({ apiKey });

export const sendChatMessage = async (history: any[], message: string) => {
    const ai = getClient();
    const chat = ai.chats.create({
        model: 'gemini-2.0-flash-exp', // Updated to a valid public model or keep preview if access exists
        history: history,
        config: {
            systemInstruction: "Sen 'Arkadaş' Özel Eğitim ERP asistanısın. MEB mevzuatına ve BEP kurallarına hakimsin.",
        }
    });
    const result = await chat.sendMessage({ message });
    return result.text;
};

export const generateBEPReport = async (studentName: string, diagnosis: string, observations: string) => {
    const ai = getClient();
    const prompt = `Öğrenci: ${studentName}, Tanı: ${diagnosis}, Gözlemler: ${observations}. MEB standartlarında BEP Gelişim Raporu oluştur.`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash-exp',
        contents: prompt
    });
    return response.text;
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
