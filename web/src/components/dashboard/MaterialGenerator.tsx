"use client";

import React, { useState } from 'react';
import { generateEducationalImage } from '@/services/geminiService';
import { Image as ImageIcon, Loader2, Download, Maximize2 } from 'lucide-react';

const MaterialGenerator: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [size, setSize] = useState<'1K' | '2K' | '4K'>('1K');
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        setLoading(true);
        setImageUrl(null);
        try {
            const result = await generateEducationalImage(prompt, size);
            setImageUrl(result);
        } catch (error) {
            alert("Görsel oluşturulamadı.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-800">Eğitim Materyali Üreticisi</h2>
                <p className="text-slate-500">Özel eğitim için görsel kartlar ve materyaller tasarlayın.</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div className="flex flex-col gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Materyal Açıklaması</label>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Örn: Kırmızı elma tutan mutlu bir çocuk, çizgi film tarzı, basit arka plan..."
                            className="w-full p-4 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none h-24 resize-none"
                        />
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Çözünürlük</label>
                            <select
                                value={size}
                                onChange={(e) => setSize(e.target.value as any)}
                                className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50 outline-none"
                            >
                                <option value="1K">1K (Hızlı - Taslak)</option>
                                <option value="2K">2K (Standart - Baskı)</option>
                                <option value="4K">4K (Yüksek - Poster)</option>
                            </select>
                        </div>
                        <button
                            onClick={handleGenerate}
                            disabled={loading || !prompt}
                            className="flex-1 mt-6 bg-lila-600 hover:bg-lila-700 text-white py-2.5 rounded-lg font-bold shadow-md transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <ImageIcon size={20} />}
                            Materyal Üret
                        </button>
                    </div>
                </div>
            </div>

            {/* Result Area */}
            <div className="bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 min-h-[400px] flex items-center justify-center relative overflow-hidden group">
                {loading ? (
                    <div className="text-center">
                        <Loader2 className="w-12 h-12 text-lila-500 animate-spin mx-auto mb-4" />
                        <p className="text-slate-500 animate-pulse">Yapay zeka çiziyor...</p>
                    </div>
                ) : imageUrl ? (
                    <>
                        <img src={imageUrl} alt="Generated" className="max-w-full max-h-[600px] object-contain shadow-lg rounded-lg" />
                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <a href={imageUrl} download="materyal.png" className="bg-white p-2 rounded-lg shadow-md hover:text-green-600 text-slate-700">
                                <Download size={20} />
                            </a>
                            <button className="bg-white p-2 rounded-lg shadow-md hover:text-blue-600 text-slate-700">
                                <Maximize2 size={20} />
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="text-center text-slate-400">
                        <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-20" />
                        <p>Görsel önizlemesi burada görünecek</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MaterialGenerator;
