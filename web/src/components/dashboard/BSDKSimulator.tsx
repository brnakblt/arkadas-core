/* eslint-disable no-undef */
"use client";

import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, CheckCircle, UserCheck } from 'lucide-react';
import { MOCK_STUDENTS } from './constants';

const BSDKSimulator: React.FC = () => {
    // eslint-disable-next-line no-undef
    const videoRef = useRef<HTMLVideoElement>(null);
    // eslint-disable-next-line no-undef
    const canvasRef = useRef<HTMLCanvasElement>(null);
    // eslint-disable-next-line no-undef
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [status, setStatus] = useState<'idle' | 'scanning' | 'verified' | 'failed'>('idle');
    const [verifiedStudent, setVerifiedStudent] = useState<any>(null);

    // Start Camera
    useEffect(() => {
        const startCamera = async () => {
            try {
                const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
                setStream(mediaStream);
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                }
            } catch (err) {
                console.error("Camera access denied:", err);
            }
        };
        startCamera();

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleScan = () => {
        setStatus('scanning');
        setIsScanning(true);

        // Simulate Network/Processing Delay
        setTimeout(() => {
            // Capture frame (conceptually)
            if (videoRef.current && canvasRef.current) {
                const context = canvasRef.current.getContext('2d');
                if (context) {
                    context.drawImage(videoRef.current, 0, 0, 320, 240);
                }
            }

            // Mock Random Verification
            const success = Math.random() > 0.2; // 80% success rate
            if (success) {
                setStatus('verified');
                setVerifiedStudent(MOCK_STUDENTS[0]); // Mock matching Ali
            } else {
                setStatus('failed');
            }
            setIsScanning(false);
        }, 2000);
    };

    const reset = () => {
        setStatus('idle');
        setVerifiedStudent(null);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-140px)]">
            {/* Left: Camera Feed */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Camera className="text-primary-600" size={20} />
                    BSDK Canlı İzleme
                </h3>

                <div className="relative bg-black rounded-lg overflow-hidden aspect-video flex-1 flex items-center justify-center">
                    <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        className={`w-full h-full object-cover ${status === 'scanning' ? 'opacity-50' : 'opacity-100'}`}
                    />
                    {/* Scan Overlay */}
                    {status === 'scanning' && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-48 h-48 border-4 border-primary-500 rounded-lg animate-pulse relative">
                                <div className="absolute top-0 left-0 w-full h-1 bg-primary-400 animate-bounce"></div>
                            </div>
                        </div>
                    )}

                    <canvas ref={canvasRef} width="320" height="240" className="hidden" />
                </div>

                <div className="mt-6 flex justify-center gap-4">
                    {status === 'idle' || status === 'failed' ? (
                        <button
                            onClick={handleScan}
                            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-full font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
                        >
                            <UserCheck size={20} />
                            Yoklama Al (Yüz Tarama)
                        </button>
                    ) : status === 'verified' ? (
                        <button
                            onClick={reset}
                            className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-6 py-3 rounded-full font-semibold flex items-center gap-2"
                        >
                            <RefreshCw size={20} />
                            Yeni Tarama
                        </button>
                    ) : null}
                </div>
            </div>

            {/* Right: Technical Info & Results */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col">
                <h3 className="text-lg font-bold text-slate-800 mb-4">İşlem Kayıtları ve Akış</h3>

                <div className="flex-1 bg-slate-50 rounded-lg p-4 mb-4 overflow-y-auto font-mono text-sm space-y-2 border border-slate-200">
                    <div className="text-slate-400">// Sistem Başlatıldı...</div>
                    <div className="text-slate-400">// Kamera bağlantısı kuruldu (HTTPS)</div>
                    {status === 'scanning' && (
                        <>
                            <div className="text-blue-600">&gt;&gt; Görüntü yakalanıyor...</div>
                            <div className="text-blue-600">&gt;&gt; Biyometrik vektörler çıkarılıyor (Local Processing)...</div>
                            <div className="text-blue-600">&gt;&gt; Hash verisi buluta gönderiliyor (KVKK Uyumlu)...</div>
                        </>
                    )}
                    {status === 'verified' && (
                        <>
                            <div className="text-green-600">&gt;&gt; EŞLEŞME BULUNDU (Confidence: 98.4%)</div>
                            <div className="text-green-700">&gt;&gt; MEBBIS Entegrasyonu: Oturum açıldı.</div>
                            <div className="text-slate-600">&gt;&gt; Öğrenci: {verifiedStudent?.fullName}</div>
                            <div className="text-slate-600">&gt;&gt; Zaman: {new Date().toLocaleTimeString()}</div>
                        </>
                    )}
                    {status === 'failed' && (
                        <div className="text-red-600">&gt;&gt; EŞLEŞME BAŞARISIZ. Lütfen tekrar deneyin.</div>
                    )}
                </div>

                <div className="border-t border-slate-100 pt-4">
                    <h4 className="font-semibold text-slate-700 mb-2">Sistem Mimarisi Notu:</h4>
                    <p className="text-sm text-slate-500 leading-relaxed">
                        Bu modül BSDK (Biyometrik Kimlik Doğrulama) simülasyonudur. Gerçek senaryoda:
                        <br />
                        1. IP Kameradan alınan görüntü yerel sunucuda (Edge Device) işlenir.
                        <br />
                        2. Yüz verisi vektöre dönüştürülür (Görüntü saklanmaz).
                        <br />
                        3. Sadece doğrulama sonucu ve işlem imzası MEB sunucularına iletilir.
                    </p>
                </div>
            </div>

            {/* Result Modal Overlay */}
            {status === 'verified' && verifiedStudent && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl transform scale-100 transition-transform">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="text-green-600 w-10 h-10" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800">Doğrulama Başarılı</h2>
                        <p className="text-slate-500 mt-2">Ders girişi onaylandı.</p>

                        <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <img src={verifiedStudent.avatarUrl} className="w-16 h-16 rounded-full mx-auto mb-2 bg-slate-200" alt="student" />
                            <div className="font-bold text-lg text-slate-800">{verifiedStudent.fullName}</div>
                            <div className="text-sm text-slate-500">{verifiedStudent.tcIdentity}</div>
                        </div>

                        <button onClick={reset} className="mt-6 w-full bg-slate-900 text-white py-3 rounded-xl font-medium hover:bg-slate-800">
                            Tamam
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BSDKSimulator;
