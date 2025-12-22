"use client";

import TTSPlayground from '@/components/TTSPlayground';

export default function TTSPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Metin Seslendirme (TTS)</h1>
            <p className="text-gray-600">
                Bu sayfa, Transformers.js ve ONNX Runtime kütüphanelerini kullanarak tarayıcı tabanlı (offline çalışabilen) Türkçe metin seslendirme özelliğini test etmek için hazırlanmıştır.
            </p>

            <div className="mt-8">
                <TTSPlayground />
            </div>
        </div>
    );
}
