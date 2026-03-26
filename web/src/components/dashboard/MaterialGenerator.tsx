"use client";

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { generateMaterial, generateEducationalImage } from '@/services/geminiService';
import {
    Image as ImageIcon,
    Loader2,
    Download,
    BookOpen,
    FileText,
    Copy,
    Check,
    Save
} from 'lucide-react';

const MaterialGenerator: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'story' | 'worksheet' | 'image'>('story');

    // Joint State
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null); // For Text content
    const [imageUrl, setImageUrl] = useState<string | null>(null); // For Image content
    const [copied, setCopied] = useState(false);

    // Inputs
    const [topic, setTopic] = useState('');
    const [level, setLevel] = useState('İlkokul 1. Sınıf');
    const [studentInfo, setStudentInfo] = useState('');

    // Image specific inputs
    const [imagePrompt, setImagePrompt] = useState('');
    const [imageSize, setImageSize] = useState<'1K' | '2K' | '4K'>('1K');

    const handleGenerate = async () => {
        setLoading(true);
        setResult(null);
        setImageUrl(null);

        try {
            if (activeTab === 'image') {
                if (!imagePrompt.trim()) return;
                const result = await generateEducationalImage(imagePrompt, imageSize);
                setImageUrl(result);
            } else {
                if (!topic.trim()) return;
                const content = await generateMaterial(activeTab, topic, level, studentInfo);
                setResult(content);
            }
        } catch (error) {
            console.error(error);
            alert("Materyal oluşturulurken hata oluştu. Lütfen tekrar deneyin.");
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        if (!result) return;
        navigator.clipboard.writeText(result);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-800">Eğitim Materyali Üreticisi</h2>
                <p className="text-slate-500">Yapay zeka ile size özel hikayeler, çalışma kağıtları ve görseller tasarlayın.</p>
            </div>

            {/* Tabs */}
            <div className="flex justify-center mb-6">
                <div className="bg-slate-100 p-1 rounded-xl flex gap-1">
                    <button
                        onClick={() => setActiveTab('story')}
                        className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${activeTab === 'story' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <BookOpen size={18} /> Hikaye Oluştur
                    </button>
                    <button
                        onClick={() => setActiveTab('worksheet')}
                        className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${activeTab === 'worksheet' ? 'bg-white shadow-sm text-purple-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <FileText size={18} /> Çalışma Kağıdı
                    </button>
                    <button
                        onClick={() => setActiveTab('image')}
                        className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${activeTab === 'image' ? 'bg-white shadow-sm text-orange-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <ImageIcon size={18} /> Görsel Materyal
                    </button>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div className="flex flex-col gap-4">

                    {activeTab !== 'image' ? (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Konu / Tema</label>
                                    <input
                                        type="text"
                                        value={topic}
                                        onChange={(e) => setTopic(e.target.value)}
                                        placeholder={activeTab === 'story' ? "Örn: Uzayda kaybolan kedi" : "Örn: Basit toplama işlemi"}
                                        className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Öğrenci Seviyesi</label>
                                    <select
                                        value={level}
                                        onChange={(e) => setLevel(e.target.value)}
                                        className="w-full p-3 border border-slate-200 rounded-lg bg-white outline-none"
                                    >
                                        <option>Okul Öncesi</option>
                                        <option>İlkokul 1. Sınıf</option>
                                        <option>İlkokul 2. Sınıf</option>
                                        <option>İlkokul 3. Sınıf</option>
                                        <option>İlkokul 4. Sınıf</option>
                                        <option>Ortaokul</option>
                                        <option>Özel Eğitim (Hafif Düzey)</option>
                                        <option>Özel Eğitim (Orta Düzey)</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Öğrenci Hakkında Ek Bilgi (Opsiyonel)</label>
                                <textarea
                                    value={studentInfo}
                                    onChange={(e) => setStudentInfo(e.target.value)}
                                    placeholder="Örn: Görsel hafızası güçlü, dikkati çabuk dağılıyor..."
                                    className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-20 resize-none"
                                />
                            </div>
                        </>
                    ) : (
                        // Image Inputs
                        <div className="flex flex-col gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Görsel Açıklaması</label>
                                <textarea
                                    value={imagePrompt}
                                    onChange={(e) => setImagePrompt(e.target.value)}
                                    placeholder="Örn: Kırmızı elma tutan mutlu bir çocuk, çizgi film tarzı..."
                                    className="w-full p-4 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none h-24 resize-none"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Çözünürlük</label>
                                <select
                                    value={imageSize}
                                    onChange={(e) => setImageSize(e.target.value as '1K' | '2K' | '4K')}
                                    className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50 outline-none"
                                >
                                    <option value="1K">1K (Hızlı - Taslak)</option>
                                    <option value="2K">2K (Standart - Baskı)</option>
                                    <option value="4K">4K (Yüksek - Poster)</option>
                                </select>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={handleGenerate}
                        disabled={loading || (activeTab === 'image' ? !imagePrompt : !topic)}
                        className={`w-full mt-4 py-3 rounded-lg font-bold shadow-md transition-all flex items-center justify-center gap-2 text-white
                            ${activeTab === 'story' ? 'bg-blue-600 hover:bg-blue-700' :
                                activeTab === 'worksheet' ? 'bg-purple-600 hover:bg-purple-700' :
                                    'bg-orange-600 hover:bg-orange-700'}`}
                    >
                        {loading ? <Loader2 className="animate-spin" /> : activeTab === 'image' ? <ImageIcon size={20} /> : <FileText size={20} />}
                        {activeTab === 'story' ? 'Hikaye Yaz' : activeTab === 'worksheet' ? 'Çalışma Kağıdı Oluştur' : 'Görsel Üret'}
                    </button>
                </div>
            </div>

            {/* Result Area */}
            {(result || imageUrl || loading) && (
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 min-h-[200px] relative">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-48 space-y-4">
                            <Loader2 className={`w-10 h-10 animate-spin ${activeTab === 'story' ? 'text-blue-500' : activeTab === 'worksheet' ? 'text-purple-500' : 'text-orange-500'}`} />
                            <p className="text-slate-500 text-sm animate-pulse">
                                {activeTab === 'story' ? 'Hikaye kurgulanıyor...' : activeTab === 'worksheet' ? 'Sorular hazırlanıyor...' : 'Görsel çiziliyor...'}
                            </p>
                        </div>
                    ) : imageUrl ? (
                        <div className="flex items-center justify-center relative group">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={imageUrl} alt="Generated" className="max-w-full max-h-[600px] object-contain shadow-lg rounded-lg" />
                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <a href={imageUrl} download="materyal.png" className="bg-white p-2 rounded-lg shadow-md hover:text-green-600 text-slate-700">
                                    <Download size={20} />
                                </a>
                            </div>
                        </div>
                    ) : result ? (
                        <div className="prose prose-slate max-w-none">
                            <div className="flex justify-end gap-2 mb-4">
                                <button
                                    onClick={handleCopy}
                                    className="flex items-center gap-1 text-sm text-slate-500 hover:text-blue-600 transition-colors"
                                >
                                    {copied ? <Check size={16} /> : <Copy size={16} />}
                                    {copied ? 'Kopyalandı' : 'Kopyala'}
                                </button>
                                <button className="flex items-center gap-1 text-sm text-slate-500 hover:text-green-600 transition-colors">
                                    <Save size={16} /> Kaydet
                                </button>
                            </div>
                            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100">
                                <ReactMarkdown>{result}</ReactMarkdown>
                            </div>
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    );
};

export default MaterialGenerator;
