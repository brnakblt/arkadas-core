"use client";

import React, { useState } from 'react';
import { generateBEPReport, speakText, playAudioBuffer } from '@/services/geminiService';
import { Sparkles, FileText, Volume2, Loader2, Download } from 'lucide-react';
import { MOCK_STUDENTS } from './constants';

const BEPGenerator: React.FC = () => {
    const [selectedStudentId, setSelectedStudentId] = useState(MOCK_STUDENTS[0].id);
    const [observations, setObservations] = useState('');
    const [report, setReport] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);

    const selectedStudent = MOCK_STUDENTS.find(s => s.id === selectedStudentId);

    const handleGenerate = async () => {
        if (!selectedStudent || !observations.trim()) return;

        setIsGenerating(true);
        try {
            const result = await generateBEPReport(selectedStudent.fullName, selectedStudent.diagnosis, observations);
            setReport(result || "Rapor oluşturulamadı.");
        } catch (error) {
            alert("Rapor oluşturulamadı. API Key kontrol edin.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSpeak = async () => {
        if (!report) return;
        setIsSpeaking(true);
        try {
            // Speak only the first paragraph or first 200 chars to avoid huge usage in demo
            const textToSpeak = report.slice(0, 300) + "...";
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

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-140px)]">
            <div className="flex flex-col space-y-4">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex-1 flex flex-col">
                    <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Sparkles className="text-lila-500" size={24} />
                        AI BEP Oluşturucu
                    </h2>

                    <div className="space-y-4 flex-1">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Öğrenci Seçin</label>
                            <select
                                value={selectedStudentId}
                                onChange={(e) => setSelectedStudentId(e.target.value)}
                                className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:ring-2 focus:ring-primary-500 outline-none"
                            >
                                {MOCK_STUDENTS.map(s => (
                                    <option key={s.id} value={s.id}>{s.fullName} - {s.diagnosis}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex-1 flex flex-col h-full">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Gözlem Notlarınız (Kısa ve basit cümleler)</label>
                            <textarea
                                value={observations}
                                onChange={(e) => setObservations(e.target.value)}
                                placeholder="Örn: Ali bugün göz teması kurmakta zorlandı. Renkleri eşleştirmede başarılıydı ama kırmızı rengi karıştırdı. Komutlara geç tepki verdi."
                                className="w-full flex-1 min-h-[200px] p-4 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none resize-none"
                            />
                        </div>
                    </div>

                    <div className="mt-6">
                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating || !observations.trim()}
                            className="w-full bg-gradient-to-r from-primary-600 to-lila-600 hover:from-primary-700 hover:to-lila-700 text-white py-3 rounded-lg font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                        >
                            {isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
                            {isGenerating ? 'Yapay Zeka Raporu Yazıyor...' : 'Profesyonel Rapor Oluştur'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col h-full">
                <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-4">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <FileText size={20} className="text-slate-500" />
                        Oluşturulan Rapor
                    </h3>
                    <div className="flex gap-2">
                        <button
                            onClick={handleSpeak}
                            disabled={!report || isSpeaking}
                            className="p-2 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Sesli Oku"
                        >
                            {isSpeaking ? <Loader2 className="animate-spin" size={20} /> : <Volume2 size={20} />}
                        </button>
                        <button disabled={!report} className="p-2 text-slate-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50" title="İndir">
                            <Download size={20} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto bg-slate-50 p-6 rounded-lg border border-slate-200 prose prose-slate prose-sm max-w-none">
                    {report ? (
                        <div className="whitespace-pre-wrap">{report}</div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                            <FileText size={48} className="mb-4 opacity-20" />
                            <p>Henüz rapor oluşturulmadı.</p>
                            <p className="text-xs">Sol taraftan notlarınızı girip butona tıklayın.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BEPGenerator;
