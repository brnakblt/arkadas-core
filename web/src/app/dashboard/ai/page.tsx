'use client';

import AIChat from '@/components/ai/AIChat';

export default function AIAssistantPage() {
    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">AI Asistan</h1>
                <p className="text-gray-500 mt-2">
                    Özel eğitim, rehabilitasyon ve MEBBIS işlemleri hakkında sorularınızı sorun.
                </p>
            </div>

            <AIChat />
        </div>
    );
}
