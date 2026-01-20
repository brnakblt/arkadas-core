"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, Bot, User, Loader2 } from 'lucide-react';
import { sendChatMessage } from '@/services/geminiService';

interface Message {
    id: string;
    role: 'user' | 'model';
    text: string;
}

const SUGGESTED_QUESTIONS = [
    "Haftalık maksimum ders saati kaç?",
    "BEP güncelleme süresi nedir?",
    "Telafi eğitimi şartları neler?",
    "Devamsızlık sınırı var mı?",
    "Bir öğretmen günde kaç derse girebilir?"
];

const AIChat: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', role: 'model', text: 'Merhaba! Ben Arkadaş Asistan. MEB mevzuatı ve sistem kullanımı hakkında her şeyi sorabilirsiniz. Size nasıl yardımcı olabilirim?' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (text: string = input) => {
        const messageText = text.trim();
        if (!messageText || loading) return;

        const userMsg: Message = { id: Date.now().toString(), role: 'user', text: messageText };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            // Format history for Gemini based on GoogleGenAI types
            const history = messages.map(m => ({
                role: m.role,
                parts: [{ text: m.text }]
            }));

            const responseText = await sendChatMessage(history, messageText);

            const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'model', text: responseText || "Yanıt alınamadı." };
            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            console.error(error);
            const errorMsg: Message = { id: (Date.now() + 1).toString(), role: 'model', text: 'Bağlantı hatası oluştu. Lütfen tekrar deneyin.' };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setLoading(false);
        }
    };

    const handleClear = () => {
        setMessages([{ id: '1', role: 'model', text: 'Sohbet temizlendi. Yeni bir soru sorabilirsiniz.' }]);
    };

    return (
        <div className="h-[calc(100vh-120px)] flex flex-col bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white shadow-md">
                        <Bot size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800">Arkadaş Asistan</h3>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            Çevrimiçi (MEB Modu)
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleClear}
                    className="text-xs text-slate-400 hover:text-red-500 transition-colors px-3 py-1 rounded border border-slate-200 hover:border-red-200"
                >
                    Sohbeti Temizle
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-slate-700' : 'bg-white text-indigo-600 border border-indigo-100'}`}>
                                {msg.role === 'user' ? <User size={16} className="text-white" /> : <Bot size={16} />}
                            </div>
                            <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user'
                                ? 'bg-slate-800 text-white rounded-tr-none'
                                : 'bg-white text-slate-700 border border-slate-200 rounded-tl-none ProseMirror'
                                }`}>
                                <div className="whitespace-pre-wrap">{msg.text}</div>
                            </div>
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="flex justify-start">
                        <div className="flex gap-3 max-w-[80%]">
                            <div className="w-8 h-8 rounded-full bg-white text-indigo-600 border border-indigo-100 flex items-center justify-center shadow-sm">
                                <Bot size={16} />
                            </div>
                            <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-none flex items-center gap-3 shadow-sm">
                                <Loader2 size={16} className="animate-spin text-indigo-500" />
                                <span className="text-xs text-slate-500 font-medium">Mevzuat taranıyor...</span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white border-t border-slate-100 space-y-3">
                {/* Suggestions */}
                {messages.length < 3 && !loading && (
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {SUGGESTED_QUESTIONS.map((q, i) => (
                            <button
                                key={i}
                                onClick={() => handleSend(q)}
                                className="whitespace-nowrap px-3 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-full border border-indigo-100 hover:bg-indigo-100 transition-colors"
                            >
                                {q}
                            </button>
                        ))}
                    </div>
                )}

                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Mevzuat, ders saatleri veya BEP kuralları hakkında sorun..."
                        className="flex-1 px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-slate-50 focus:bg-white"
                        disabled={loading}
                    />
                    <button
                        onClick={() => handleSend()}
                        disabled={loading || !input.trim()}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95"
                    >
                        <Send size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AIChat;


