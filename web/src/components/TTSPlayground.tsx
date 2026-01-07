"use client";

import { useState } from 'react';
import { useTTS } from '../hooks/useTTS';

export default function TTSPlayground() {
    const [text, setText] = useState("Arkadaş Özel Eğitim'e hoş geldiniz.");
    const { speak, isLoading, isSpeaking, error, progress } = useTTS();

    return (
        <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-md space-y-4">
            <h2 className="text-xl font-bold text-gray-800">Türkçe TTS Testi (Offline)</h2>

            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Metin Girin</label>
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    placeholder="Seslendirmek için bir şeyler yazın..."
                />
            </div>

            <button
                onClick={() => speak(text)}
                disabled={isLoading || isSpeaking || !text}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
          ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'}
        `}
            >
                {isLoading
                    ? (progress ? `Model Yükleniyor... %${progress.toFixed(0)}` : "İşleniyor...")
                    : (isSpeaking ? "Konuşuyor..." : "Seslendir")
                }
            </button>

            {error && (
                <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">
                    Hata: {error}
                </div>
            )}

            <p className="text-xs text-gray-500 text-center">
                Powered by Transformers.js & ONNX Runtime (Client-Side)
            </p>
        </div>
    );
}
