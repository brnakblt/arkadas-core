"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, Bot, User, Loader2 } from 'lucide-react';
import { sendChatMessage } from '@/services/geminiService';

interface Message {
    id: string;
    role: 'user' | 'model';
    text: string;
}

const AIChat: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', role: 'model', text: 'Merhaba! Ben Arkadaş AI. MEB mevzuatı, BEP hazırlama veya sistem kullanımı hakkında bana soru sorabilirsiniz.' }
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

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            // Format history for Gemini
            const history = messages.map(m => ({
                role: m.role,
                parts: [{ text: m.text }]
            }));

            const responseText = await sendChatMessage(history, userMsg.text);

            const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'model', text: responseText || "Yanıt alınamadı." };
            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            const errorMsg: Message = { id: (Date.now() + 1).toString(), role: 'model', text: 'Üzgünüm, şu anda yanıt veremiyorum. Lütfen internet bağlantınızı kontrol edin veya API anahtarınızı doğrulayın.' };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-[calc(100vh-120px)] flex flex-col bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-500 rounded-full flex items-center justify-center text-white">
                    <Bot size={24} />
                </div>
                <div>
                    <h3 className="font-bold text-slate-800">Arkadaş Asistan</h3>
                    <p className="text-xs text-slate-500">Gemini 2.0 Flash ile güçlendirildi</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex gap-3 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-slate-700' : 'bg-primary-100 text-primary-600'}`}>
                                {msg.role === 'user' ? <User size={16} className="text-white" /> : <Bot size={16} />}
                            </div>
                            <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user'
                                    ? 'bg-slate-800 text-white rounded-tr-none'
                                    : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                                }`}>
                                {msg.text}
                            </div>
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                        <div className="flex gap-3 max-w-[80%]">
                            <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center">
                                <Bot size={16} />
                            </div>
                            <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-none flex items-center gap-2">
                                <Loader2 size={16} className="animate-spin text-primary-500" />
                                <span className="text-xs text-slate-500">Yazıyor...</span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white border-t border-slate-100">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Mevzuat, BEP veya raporlar hakkında soru sorun..."
                        className="flex-1 px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        disabled={loading}
                    />
                    <button
                        onClick={handleSend}
                        disabled={loading || !input.trim()}
                        className="bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 text-white p-3 rounded-xl transition-colors"
                    >
                        <Send size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AIChat;
