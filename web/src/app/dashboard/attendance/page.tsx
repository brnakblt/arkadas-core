
"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import FaceRecognition from '@/components/features/FaceRecognition';
import { UserCheck, ShieldCheck, Clock } from 'lucide-react';

const AttendancePage: React.FC = () => {
    const [mode, setMode] = useState<'register' | 'verify'>('verify');
    const [lastDetection, _setLastDetection] = useState<string | null>(null);

    const handleFaceDetected = (descriptor: Float32Array, livenessVerified: boolean) => {
        // In a real app, we would save this to the database
        console.warn("Registered Face Descriptor:", descriptor, "Liveness:", livenessVerified);
        alert(`Yüz başarıyla kaydedildi! (Canlılık: ${livenessVerified})`);
        setMode('verify');
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                        <ShieldCheck className="text-blue-600" size={32} />
                        Akıllı Yoklama Sistemi
                    </h1>
                    <p className="text-slate-500 mt-2">
                        Yüz tanıma teknolojisi ile güvenli ve hızlı katılım takibi.
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setMode('verify')}
                        className={`px-4 py-2 rounded-lg font-medium transition ${mode === 'verify' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                        Yoklama Modu
                    </button>
                    <button
                        onClick={() => setMode('register')}
                        className={`px-4 py-2 rounded-lg font-medium transition ${mode === 'register' ? 'bg-purple-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                        Kayıt Modu
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Camera Section */}
                <div className="lg:col-span-2">
                    <FaceRecognition
                        mode={mode}
                        onFaceDetected={handleFaceDetected}
                        // Mock known descriptors likely empty initially
                        knownDescriptors={[]}
                    />
                    <div className="mt-4 bg-blue-50 text-blue-800 p-4 rounded-lg flex items-start gap-3 text-sm">
                        <Clock className="shrink-0 mt-0.5" size={16} />
                        <div>
                            <p className="font-bold">Nasıl Çalışır?</p>
                            <p>Kameraya bakarak 1-2 saniye bekleyin. Sistem otomatik olarak yüzünüzü algılayacak ve kayıtlı profilinizle eşleştirecektir.</p>
                        </div>
                    </div>
                </div>

                {/* Status Section */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <UserCheck className="text-green-600" size={20} />
                            Son Hareketler
                        </h3>

                        <div className="space-y-4">
                            {/* Mock Data */}
                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden relative">
                                        <Image src="https://picsum.photos/id/64/100/100" alt="Avatar" width={40} height={40} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800 text-sm">Ali Yılmaz</p>
                                        <p className="text-xs text-slate-500">Öğrenci</p>
                                    </div>
                                </div>
                                <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded">08:45</span>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden relative">
                                        <Image src="https://picsum.photos/id/65/100/100" alt="Avatar" width={40} height={40} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800 text-sm">Ayşe Demir</p>
                                        <p className="text-xs text-slate-500">Öğretmen</p>
                                    </div>
                                </div>
                                <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded">08:30</span>
                            </div>

                            {lastDetection ? (
                                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg animate-pulse">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-green-200 flex items-center justify-center">
                                            <UserCheck size={20} className="text-green-700" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-green-900 text-sm">{lastDetection}</p>
                                            <p className="text-xs text-green-700">Yeni Giriş</p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold text-green-700">Şimdi</span>
                                </div>
                            ) : (
                                <p className="text-center text-slate-400 text-sm py-4">Yeni hareket bekleniyor...</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AttendancePage;
