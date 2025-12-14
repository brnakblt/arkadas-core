/**
 * ChatRoom Component
 * Messaging UI with conversation list and chat
 */

"use client";

import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faComments,
    faPaperPlane,
    faSpinner,
    faUser,
    faCheck,
    faCheckDouble,
} from '@fortawesome/free-solid-svg-icons';
import useChat from '@/hooks/useChat';

interface Message {
    id: number;
    actorDisplayName: string;
    message: string;
    timestamp: number;
    systemMessage: string;
}

interface Conversation {
    token: string;
    displayName: string;
    unreadMessages: number;
    lastMessage?: Message;
}

const ChatRoom: React.FC = () => {
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const {
        conversations,
        currentConversation,
        messages,
        isLoading,
        error,
        loadConversations,
        selectConversation,
        sendMessage,
        markAsRead,
    } = useChat();

    useEffect(() => {
        loadConversations();
    }, [loadConversations]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (currentConversation && currentConversation.unreadMessages > 0) {
            markAsRead();
        }
    }, [currentConversation, markAsRead]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        const message = input;
        setInput('');
        await sendMessage(message);
    };

    const formatTime = (timestamp: number): string => {
        return new Date(timestamp * 1000).toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatDate = (timestamp: number): string => {
        return new Date(timestamp * 1000).toLocaleDateString('tr-TR', {
            day: '2-digit',
            month: 'short',
        });
    };

    return (
        <div className="flex h-[600px] bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Conversation List */}
            <div className="w-80 border-r border-gray-100 flex flex-col">
                <div className="p-4 bg-gradient-to-r from-green-600 to-emerald-600">
                    <h2 className="text-white font-semibold flex items-center gap-2">
                        <FontAwesomeIcon icon={faComments} />
                        Mesajlar
                    </h2>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {isLoading && conversations.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                            <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                        </div>
                    ) : conversations.length === 0 ? (
                        <div className="p-4 text-center text-gray-400">
                            Henüz sohbet yok
                        </div>
                    ) : (
                        conversations.map((conv) => (
                            <button
                                key={conv.token}
                                onClick={() => selectConversation(conv.token)}
                                className={`w-full p-4 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 ${currentConversation?.token === conv.token ? 'bg-green-50' : ''
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                        <FontAwesomeIcon icon={faUser} className="text-gray-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium text-gray-800 truncate">
                                                {conv.displayName}
                                            </span>
                                            {conv.unreadMessages > 0 && (
                                                <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                                                    {conv.unreadMessages}
                                                </span>
                                            )}
                                        </div>
                                        {conv.lastMessage && (
                                            <p className="text-sm text-gray-500 truncate">
                                                {conv.lastMessage.message}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
                {currentConversation ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 border-b bg-gray-50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                    <FontAwesomeIcon icon={faUser} className="text-green-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-800">
                                        {currentConversation.displayName}
                                    </h3>
                                    <p className="text-xs text-gray-500">Çevrimiçi</p>
                                </div>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex ${msg.systemMessage ? 'justify-center' : 'justify-start'
                                        }`}
                                >
                                    {msg.systemMessage ? (
                                        <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                                            {msg.message}
                                        </span>
                                    ) : (
                                        <div className="max-w-[70%]">
                                            <div className="text-xs text-gray-500 mb-1">
                                                {msg.actorDisplayName}
                                            </div>
                                            <div className="bg-white px-4 py-2 rounded-2xl rounded-bl-md shadow-sm">
                                                <p className="text-gray-800">{msg.message}</p>
                                                <div className="flex items-center justify-end gap-1 mt-1">
                                                    <span className="text-[10px] text-gray-400">
                                                        {formatTime(msg.timestamp)}
                                                    </span>
                                                    <FontAwesomeIcon
                                                        icon={faCheckDouble}
                                                        className="text-green-500 text-[10px]"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <form onSubmit={handleSend} className="p-4 border-t bg-white">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Mesaj yazın..."
                                    className="flex-1 px-4 py-3 bg-gray-100 rounded-xl focus:ring-2 focus:ring-green-200 focus:bg-white outline-none transition-all"
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim()}
                                    className="px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors"
                                >
                                    <FontAwesomeIcon icon={faPaperPlane} />
                                </button>
                            </div>
                        </form>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-400">
                        <div className="text-center">
                            <FontAwesomeIcon icon={faComments} className="text-5xl mb-3" />
                            <p>Bir sohbet seçin</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Error */}
            {error && (
                <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-lg">
                    {error}
                </div>
            )}
        </div>
    );
};

export default ChatRoom;
