'use client';

import ChatRoom from '@/components/chat/ChatRoom';

export default function MessagesPage() {
    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Mesajlar</h1>
                <p className="text-gray-500 mt-2">
                    Veli ve öğretmenlerle anlık mesajlaşma
                </p>
            </div>

            <ChatRoom />
        </div>
    );
}
