/**
 * AIChat Component
 * Chat interface for AI assistant
 */

"use client";

import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faPaperPlane,
    faRobot,
    faUser,
    faSpinner,
    faTrash,
    faStop,
} from '@fortawesome/free-solid-svg-icons';
import useAIChat from '@/hooks/useAIChat';

const AIChat: React.FC = () => {
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const {
        messages,
        response,
        isStreaming,
        error,
        sendMessage,
        clearMessages,
        stopStreaming,
    } = useAIChat();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, response]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isStreaming) return;

        const message = input;
        setInput('');
        await sendMessage(message);
        inputRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <div className="flex flex-col h-[600px] bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                        <FontAwesomeIcon icon={faRobot} className="text-white text-lg" />
                    </div>
                    <div>
                        <h2 className="text-white font-semibold">AI Asistan</h2>
                        <p className="text-white/70 text-sm">
                            {isStreaming ? 'Yazıyor...' : 'Size nasıl yardımcı olabilirim?'}
                        </p>
                    </div>
                </div>
                <button
                    onClick={clearMessages}
                    className="text-white/70 hover:text-white transition-colors p-2"
                    title="Sohbeti Temizle"
                >
                    <FontAwesomeIcon icon={faTrash} />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && !response && (
                    <div className="text-center text-gray-400 py-8">
                        <FontAwesomeIcon icon={faRobot} className="text-4xl mb-3" />
                        <p>Merhaba! Size nasıl yardımcı olabilirim?</p>
                        <div className="mt-4 flex flex-wrap justify-center gap-2">
                            {['BEP formu nasıl doldurulur?', 'MEBBIS işlemleri', 'Öğrenci raporu'].map((q) => (
                                <button
                                    key={q}
                                    onClick={() => setInput(q)}
                                    className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full text-sm hover:bg-gray-200 transition-colors"
                                >
                                    {q}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {messages.map((msg, index) => (
                    <div
                        key={index}
                        className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        {msg.role === 'assistant' && (
                            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <FontAwesomeIcon icon={faRobot} className="text-indigo-600 text-sm" />
                            </div>
                        )}
                        <div
                            className={`max-w-[80%] px-4 py-3 rounded-2xl ${msg.role === 'user'
                                    ? 'bg-indigo-600 text-white rounded-br-md'
                                    : 'bg-gray-100 text-gray-800 rounded-bl-md'
                                }`}
                        >
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                        </div>
                        {msg.role === 'user' && (
                            <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                                <FontAwesomeIcon icon={faUser} className="text-white text-sm" />
                            </div>
                        )}
                    </div>
                ))}

                {/* Streaming response */}
                {isStreaming && response && (
                    <div className="flex gap-3">
                        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <FontAwesomeIcon icon={faRobot} className="text-indigo-600 text-sm" />
                        </div>
                        <div className="max-w-[80%] px-4 py-3 bg-gray-100 text-gray-800 rounded-2xl rounded-bl-md">
                            <p className="whitespace-pre-wrap">{response}</p>
                            <span className="inline-block w-2 h-4 bg-indigo-600 animate-pulse ml-1" />
                        </div>
                    </div>
                )}

                {/* Loading */}
                {isStreaming && !response && (
                    <div className="flex gap-3">
                        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <FontAwesomeIcon icon={faSpinner} className="text-indigo-600 text-sm animate-spin" />
                        </div>
                        <div className="px-4 py-3 bg-gray-100 rounded-2xl rounded-bl-md">
                            <span className="text-gray-400">Düşünüyor...</span>
                        </div>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="text-center text-red-500 py-2">
                        ⚠️ {error}
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-4 border-t bg-gray-50">
                <div className="flex gap-2">
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Mesajınızı yazın..."
                        className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none transition-all"
                        disabled={isStreaming}
                    />
                    {isStreaming ? (
                        <button
                            type="button"
                            onClick={stopStreaming}
                            className="px-4 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
                            title="Durdur"
                        >
                            <FontAwesomeIcon icon={faStop} />
                        </button>
                    ) : (
                        <button
                            type="submit"
                            disabled={!input.trim()}
                            className="px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <FontAwesomeIcon icon={faPaperPlane} />
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
};

export default AIChat;
