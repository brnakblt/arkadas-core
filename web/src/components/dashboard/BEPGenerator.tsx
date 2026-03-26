"use client";

import React, { useState, useEffect, useRef } from 'react';
import { speakText, playAudioBuffer, BEPData } from '@/services/geminiService';
import { Sparkles, FileText, Volume2, Loader2, Download, Target, BookOpen, PenTool, CheckCircle, Save, RefreshCw } from 'lucide-react';
import { MOCK_STUDENTS } from './constants';

const BEPGenerator: React.FC = () => {
    const [selectedStudentId, setSelectedStudentId] = useState(MOCK_STUDENTS[0].id);
    const [observations, setObservations] = useState('');
    const [strengths, setStrengths] = useState('');
    const [needs, setNeeds] = useState('');
    const [reportData, setReportData] = useState<BEPData | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);

    // Signal that React has hydrated this component (event handlers are attached)
    useEffect(() => {
        if (rootRef.current) {
            rootRef.current.setAttribute('data-hydrated', 'true');
        }
    }, []);

    const selectedStudent = MOCK_STUDENTS.find(s => s.id === selectedStudentId);
    

    const handleGenerate = async () => {
        if (!selectedStudent) return;
        
        if (observations.trim().length < 10) {
            alert("Lütfen daha detaylı gözlem giriniz (en az 10 karakter).");
            return;
        }

        setIsGenerating(true);
        setReportData(null);
        try {
            const response = await fetch('/api/ai/generate-bep', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: selectedStudent.fullName,
                    age: selectedStudent.age,
                    diagnosis: selectedStudent.diagnosis,
                    observations,
                    strengths: strengths.split('\n').filter(s => s.trim()),
                    needs: needs.split('\n').filter(n => n.trim()),
                }),
            });

            if (!response.ok) throw new Error('Generation failed');
            
            const result = await response.json();
            setReportData(result);
        } catch (error) {
            console.error(error);
            alert("Rapor oluşturulamadı. Lütfen tekrar deneyin.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSave = async () => {
        if (!reportData) return;
        setIsSaving(true);
        try {
            // Mock save functionality
            await new Promise(resolve => setTimeout(resolve, 1000));
            alert("BEP başarıyla kaydedildi!");
        } catch (error) {
            console.error(error);
            alert("Kaydetme sırasında bir hata oluştu.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleSpeak = async () => {
        if (!reportData?.performanceLevel) return;
        setIsSpeaking(true);
        try {
            const textToSpeak = reportData.performanceLevel.slice(0, 300) + "...";
            const audioBuffer = await speakText(textToSpeak);
            if (audioBuffer) {
                playAudioBuffer(audioBuffer);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsSpeaking(false);
        }
    };

    // Helper to update specific report fields (making it editable)
    const updateReportField = (field: keyof BEPData, value: any) => {
        if (!reportData) return;
        setReportData({ ...reportData, [field]: value });
    };

    const updateListField = (field: keyof BEPData, index: number, value: string) => {
        if (!reportData) return;
        const newList = [...(reportData[field] as string[])];
        newList[index] = value;
        setReportData({ ...reportData, [field]: newList });
    };

    return (
        <div ref={rootRef} className="grid grid-cols-1 xl:grid-cols-12 gap-6 h-[calc(100vh-140px)]" data-testid="bep-generator-root">
            {/* Input Section */}
            <div className="xl:col-span-4 flex flex-col space-y-4 h-full overflow-hidden">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex-1 flex flex-col overflow-y-auto">
                    <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2 sticky top-0 bg-white z-10 pb-4 border-b border-slate-50">
                        <Sparkles className="text-lila-500" size={24} />
                        BEP Asistanı
                    </h2>

                    <div className="space-y-6 flex-1">
                        <div>
                            <label htmlFor="student-select" className="block text-sm font-bold text-slate-700 mb-2">Öğrenci Seçimi</label>
                            <div className="relative">
                                <select
                                    id="student-select"
                                    value={selectedStudentId}
                                    onChange={(e) => setSelectedStudentId(e.target.value)}
                                    className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-lila-500 focus:border-lila-500 outline-none appearance-none font-medium text-slate-700"
                                >
                                    {MOCK_STUDENTS.map(s => (
                                        <option key={s.id} value={s.id}>{s.fullName} ({s.age}Y) - {s.diagnosis}</option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-3.5 pointer-events-none text-slate-500">▼</div>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="strengths-input" className="block text-sm font-bold text-slate-700 mb-2">Güçlü Yönler</label>
                            <textarea
                                id="strengths-input"
                                value={strengths}
                                onChange={(e) => setStrengths(e.target.value)}
                                placeholder="Her satıra bir özellik yazın..."
                                className="w-full h-24 p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-lila-500 outline-none resize-none bg-slate-50 text-slate-700 text-sm"
                            />
                        </div>

                        <div>
                            <label htmlFor="needs-input" className="block text-sm font-bold text-slate-700 mb-2">Gelişimsel İhtiyaçlar</label>
                            <textarea
                                id="needs-input"
                                value={needs}
                                onChange={(e) => setNeeds(e.target.value)}
                                placeholder="Her satıra bir ihtiyaç yazın..."
                                className="w-full h-24 p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-lila-500 outline-none resize-none bg-slate-50 text-slate-700 text-sm"
                            />
                        </div>

                        <div className="flex-1 flex flex-col">
                            <label htmlFor="observations-input" className="block text-sm font-bold text-slate-700 mb-2">Gözlem ve Notlar</label>
                            <p className="text-xs text-slate-500 mb-2">Öğrencinin mevcut durumu hakkında detaylı bilgi verin.</p>
                            <textarea
                                id="observations-input"
                                data-testid="observations-input"
                                value={observations}
                                onChange={(e) => setObservations(e.target.value)}
                                placeholder="Örn: Ali görsel eşlemede çok iyi ancak sözel yönergeleri almakta zorlanıyor..."
                                className="w-full flex-1 min-h-[150px] p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-lila-500 outline-none resize-none bg-slate-50 text-slate-700 leading-relaxed"
                            />
                        </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 sticky bottom-0 bg-white">
                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating || !observations.trim()}
                            data-testid="generate-bep-button"
                            className="w-full bg-gradient-to-r from-lila-600 to-indigo-600 hover:from-lila-700 hover:to-indigo-700 text-white py-4 rounded-xl font-bold shadow-lg shadow-lila-200 transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:shadow-none transform active:scale-[0.98]"
                        >
                            {isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles size={22} />}
                            {isGenerating ? 'BEP Hazırlanıyor...' : 'BEP Raporu Oluştur'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Output Section */}
            <div className="xl:col-span-8 bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col h-full overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
                        <FileText className="text-indigo-500" size={24} />
                        BEP Taslağı
                        {reportData && <span className="text-xs font-normal bg-green-100 text-green-700 px-2 py-1 rounded-full border border-green-200">Taslak Hazır</span>}
                    </h3>
                    <div className="flex gap-2">
                        <button
                            onClick={handleSpeak}
                            disabled={!reportData || isSpeaking}
                            className="p-2.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Sesli Özet"
                        >
                            {isSpeaking ? <Loader2 className="animate-spin" size={20} /> : <Volume2 size={20} />}
                        </button>
                        {reportData && (
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
                            >
                                {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                                Kaydet
                            </button>
                        )}
                        <button disabled={!reportData} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 shadow-sm">
                            <Download size={16} />
                            PDF İndir
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 bg-slate-50/30">
                    {reportData ? (
                        <div className="space-y-8 max-w-4xl mx-auto">
                            {/* Header Info */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                                    <div className="flex flex-col">
                                        <span className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">Öğrenci</span>
                                        <input 
                                            value={reportData.studentName}
                                            onChange={(e) => updateReportField('studentName', e.target.value)}
                                            className="font-semibold text-slate-900 text-lg bg-transparent border-b border-transparent hover:border-slate-200 focus:border-lila-500 outline-none"
                                        />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">Tarih</span>
                                        <input 
                                            value={reportData.bepDate}
                                            onChange={(e) => updateReportField('bepDate', e.target.value)}
                                            className="font-medium text-slate-900 bg-transparent border-b border-transparent hover:border-slate-200 focus:border-lila-500 outline-none"
                                        />
                                    </div>
                                    <div className="flex flex-col md:col-span-2">
                                        <span className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">Eğitsel Performans</span>
                                        <textarea 
                                            value={reportData.performanceLevel}
                                            onChange={(e) => updateReportField('performanceLevel', e.target.value)}
                                            className="w-full font-medium text-slate-800 leading-relaxed bg-amber-50 p-3 rounded-lg border border-amber-100 text-amber-900 outline-none focus:ring-1 focus:ring-amber-300 resize-none h-32"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Goals Grid */}
                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Long Term Goals */}
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-indigo-100 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                                    <h4 className="font-bold text-indigo-900 mb-4 flex items-center gap-2 text-lg">
                                        <Target className="text-indigo-500" size={20} />
                                        Uzun Dönemli Amaçlar
                                    </h4>
                                    <div className="space-y-3">
                                        {reportData.longTermGoals.map((goal, idx) => (
                                            <div key={idx} className="flex gap-3 text-slate-700 bg-indigo-50/50 p-3 rounded-lg">
                                                <span className="font-bold text-indigo-400">{idx + 1}.</span>
                                                <textarea 
                                                    value={goal}
                                                    onChange={(e) => updateListField('longTermGoals', idx, e.target.value)}
                                                    className="w-full bg-transparent border-none outline-none resize-none text-sm leading-relaxed"
                                                    rows={2}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Short Term Goals */}
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-pink-100 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-pink-500"></div>
                                    <h4 className="font-bold text-pink-900 mb-4 flex items-center gap-2 text-lg">
                                        <CheckCircle className="text-pink-500" size={20} />
                                        Kısa Dönemli Hedefler
                                    </h4>
                                    <div className="space-y-3">
                                        {reportData.shortTermGoals.map((goal, idx) => (
                                            <div key={idx} className="flex gap-3 text-slate-700 bg-pink-50/50 p-3 rounded-lg">
                                                <span className="font-bold text-pink-400">•</span>
                                                <textarea 
                                                    value={goal}
                                                    onChange={(e) => updateListField('shortTermGoals', idx, e.target.value)}
                                                    className="w-full bg-transparent border-none outline-none resize-none text-sm leading-relaxed"
                                                    rows={2}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Methods & Materials */}
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                    <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                        <BookOpen className="text-slate-400" size={20} />
                                        Yöntem ve Teknikler
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {reportData.teachingMethods.map((m, idx) => (
                                            <input 
                                                key={idx}
                                                value={m}
                                                onChange={(e) => updateListField('teachingMethods', idx, e.target.value)}
                                                className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-md text-sm font-medium border border-slate-200 outline-none focus:ring-1 focus:ring-lila-300"
                                            />
                                        ))}
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                    <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                        <PenTool className="text-slate-400" size={20} />
                                        Eğitim Materyalleri
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {reportData.materials.map((m, idx) => (
                                            <input 
                                                key={idx}
                                                value={m}
                                                onChange={(e) => updateListField('materials', idx, e.target.value)}
                                                className="px-3 py-1.5 bg-orange-50 text-orange-700 rounded-md text-sm font-medium border border-orange-100 outline-none focus:ring-1 focus:ring-orange-300"
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Recommendations */}
                            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-6 rounded-2xl shadow-lg text-white">
                                <h4 className="font-bold mb-4 flex items-center gap-2 text-indigo-200">
                                    <Sparkles size={20} />
                                    Uzman Tavsiyeleri
                                </h4>
                                <div className="space-y-3">
                                    {reportData.recommendations.map((rec, idx) => (
                                        <div key={idx} className="flex gap-3 text-indigo-50/90 text-sm leading-relaxed bg-white/5 p-3 rounded-lg border border-white/10">
                                            <span className="text-indigo-400 mt-1">•</span>
                                            <textarea 
                                                value={rec}
                                                onChange={(e) => updateListField('recommendations', idx, e.target.value)}
                                                className="w-full bg-transparent border-none outline-none resize-none text-sm"
                                                rows={2}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="flex justify-center pb-8">
                                <button 
                                    onClick={handleGenerate}
                                    className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-full text-sm font-bold hover:bg-slate-50 transition-all shadow-sm group"
                                >
                                    <RefreshCw size={18} className="group-hover:rotate-180 transition-transform duration-500" />
                                    Yeniden Oluştur
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4">
                            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-2">
                                <Sparkles size={40} className="text-slate-300" />
                            </div>
                            <h4 className="text-xl font-semibold text-slate-600">BEP Oluşturmaya Hazır</h4>
                            <p className="text-center max-w-md text-slate-500">
                                Sol taraftan öğrenci seçip gözlemlerinizi girin.
                                Yapay zeka MEB standartlarına uygun, kapsamlı bir BEP raporu hazırlayacaktır.
                            </p>
                            <div className="flex gap-8 mt-8 text-xs font-mono text-slate-400">
                                <div className="flex flex-col items-center gap-2">
                                    <span className="w-8 h-8 rounded bg-green-50 text-green-600 flex items-center justify-center border border-green-100">✓</span>
                                    MEB Uyumlu
                                </div>
                                <div className="flex flex-col items-center gap-2">
                                    <span className="w-8 h-8 rounded bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">✓</span>
                                    SMART Hedefler
                                </div>
                                <div className="flex flex-col items-center gap-2">
                                    <span className="w-8 h-8 rounded bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">✓</span>
                                    Pedagojik Dil
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BEPGenerator;
