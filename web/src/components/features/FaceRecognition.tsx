"use client";

import React, { useRef, useEffect, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Camera, UserCheck, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';
import type * as FaceApiType from 'face-api.js';

interface FaceRecognitionProps {
    onFaceDetected?: (descriptor: Float32Array, livenessVerified: boolean) => void;
    mode?: 'register' | 'verify';
    knownDescriptors?: { id: string; label: string; descriptor: Float32Array }[];
}

type VerificationState = 'IDLE' | 'DETECTED' | 'BUFFERING' | 'VERIFYING_LIVENESS' | 'RECOGNIZING' | 'SUCCESS' | 'ERROR';

const FaceRecognition: React.FC<FaceRecognitionProps> = ({ onFaceDetected, mode = 'verify', knownDescriptors = [] }) => {
    const webcamRef = useRef<Webcam>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [faceapi, setFaceApi] = useState<typeof FaceApiType | null>(null);
    
    const [vState, setVState] = useState<VerificationState>('IDLE');
    const [statusMessage, setVStatusMessage] = useState<string>('');
    const [detectedName, setDetectedName] = useState<string | null>(null);
    
    // Frame buffer for liveness
    const frameBuffer = useRef<string[]>([]);
    const processingRef = useRef(false);

    const AI_SERVICE_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8000';

    useEffect(() => {
        const init = async () => {
            const fa = await import('face-api.js');
            setFaceApi(fa);

            const MODEL_URL = '/models';
            try {
                await Promise.all([
                    fa.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
                    fa.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                    fa.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
                ]);
                setModelsLoaded(true);
                setVStatusMessage('Sistem hazır. Lütfen kameraya bakın.');
            } catch (error) {
                console.error("Failed to load models:", error);
                setVState('ERROR');
                setVStatusMessage('Modeller yüklenemedi.');
            }
        };
        init();
    }, []);

    const resetState = useCallback(() => {
        setTimeout(() => {
            setVState('IDLE');
            setDetectedName(null);
            frameBuffer.current = [];
            processingRef.current = false;
            setVStatusMessage('Sistem hazır.');
        }, 3000);
    }, []);

    const startLivenessCapture = useCallback(async (currentDescriptor: Float32Array) => {
        if (!faceapi) return;
        processingRef.current = true;
        const frames: string[] = [];
        
        // Capture 5 frames over 1 second
        for (let i = 0; i < 5; i++) {
            const screenshot = webcamRef.current?.getScreenshot();
            if (screenshot) frames.push(screenshot);
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        setVState('VERIFYING_LIVENESS');
        
        try {
            // 1. Verify Liveness via AI Service
            const formData = new FormData();
            for (let i = 0; i < frames.length; i++) {
                const blob = await fetch(frames[i]).then(r => r.blob());
                formData.append('frames', blob, `frame_${i}.jpg`);
            }

            const livenessRes = await fetch(`${AI_SERVICE_URL}/liveness`, {
                method: 'POST',
                body: formData
            });
            const livenessData = await livenessRes.json();

            if (!livenessData.verified) {
                setVState('ERROR');
                setVStatusMessage('Canlılık doğrulanamadı! Lütfen tekrar deneyin.');
                resetState();
                return;
            }

            // 2. Recognize Person
            setVState('RECOGNIZING');
            if (mode === 'register') {
                setVState('SUCCESS');
                setVStatusMessage('Yüz başarıyla kaydedildi.');
                onFaceDetected?.(currentDescriptor, true);
                resetState();
            } else {
                if (knownDescriptors.length > 0) {
                    const faceMatcher = new faceapi.FaceMatcher(
                        knownDescriptors.map(d => new faceapi.LabeledFaceDescriptors(d.id, [d.descriptor])),
                        0.6
                    );
                    const bestMatch = faceMatcher.findBestMatch(currentDescriptor);

                    if (bestMatch.label !== 'unknown') {
                        const person = knownDescriptors.find(d => d.id === bestMatch.label);
                        setDetectedName(person?.label || 'Bilinmeyen');
                        setVState('SUCCESS');
                        setVStatusMessage(`Hoş geldiniz, ${person?.label}`);
                        onFaceDetected?.(currentDescriptor, true);
                        resetState();
                    } else {
                        setVState('ERROR');
                        setVStatusMessage('Kişi tanınamadı.');
                        resetState();
                    }
                }
            }
        } catch (error) {
            console.error("Verification error:", error);
            setVState('ERROR');
            setVStatusMessage('Sistem hatası oluştu.');
            resetState();
        }
    }, [AI_SERVICE_URL, faceapi, knownDescriptors, mode, onFaceDetected, resetState]);

    useEffect(() => {
        if (!modelsLoaded || !faceapi || vState === 'SUCCESS' || vState === 'BUFFERING' || vState === 'VERIFYING_LIVENESS' || processingRef.current) return;

        const interval = setInterval(async () => {
            if (webcamRef.current && webcamRef.current.video) {
                const video = webcamRef.current.video;
                if (video.readyState !== 4) return;

                const displaySize = { width: video.videoWidth, height: video.videoHeight };
                if (canvasRef.current) {
                    faceapi.matchDimensions(canvasRef.current, displaySize);
                }

                const detections = await faceapi.detectAllFaces(video).withFaceLandmarks().withFaceDescriptors();
                const resizedDetections = faceapi.resizeResults(detections, displaySize);

                if (canvasRef.current) {
                    const ctx = canvasRef.current.getContext('2d');
                    if (ctx) {
                        ctx.clearRect(0, 0, displaySize.width, displaySize.height);
                        faceapi.draw.drawDetections(canvasRef.current, resizedDetections);
                    }
                }

                if (resizedDetections.length > 0) {
                    const detection = resizedDetections[0];
                    const confidence = detection.detection.score;

                    if (confidence > 0.8) {
                        if (vState === 'IDLE') {
                            setVState('BUFFERING');
                            setVStatusMessage('Lütfen bekleyin, canlılık kontrolü yapılıyor...');
                            startLivenessCapture(detection.descriptor);
                        }
                    }
                }
            }
        }, 500);
        return () => clearInterval(interval);
    }, [modelsLoaded, faceapi, vState, startLivenessCapture]);

    return (
        <div className="relative w-full max-w-md mx-auto aspect-video rounded-2xl overflow-hidden bg-slate-950 border-4 border-slate-800 shadow-2xl transition-all duration-500">
            {!modelsLoaded && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-900/90 text-white">
                    <Loader2 className="animate-spin mb-4 text-blue-400" size={48} />
                    <p className="font-medium tracking-wide">Yüz Tanıma Modülleri Hazırlanıyor...</p>
                </div>
            )}

            <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                className={`w-full h-full object-cover transition-opacity duration-500 ${vState === 'SUCCESS' ? 'opacity-40' : 'opacity-100'}`}
                mirrored={true}
            />

            <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full pointer-events-none" />

            {/* Overlays */}
            <div className="absolute inset-0 pointer-events-none border-[12px] border-transparent transition-colors duration-300" 
                 style={{ borderColor: vState === 'SUCCESS' ? '#22c55e44' : vState === 'ERROR' ? '#ef444444' : 'transparent' }} />

            {/* Status Bar */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                <div className={`flex items-center gap-3 px-4 py-2 rounded-xl backdrop-blur-md border ${
                    vState === 'SUCCESS' ? 'bg-green-500/20 border-green-500/50 text-green-400' :
                    vState === 'ERROR' ? 'bg-red-500/20 border-red-500/50 text-red-400' :
                    'bg-white/10 border-white/20 text-white'
                }`}>
                    {vState === 'BUFFERING' || vState === 'VERIFYING_LIVENESS' || vState === 'RECOGNIZING' ? (
                        <Loader2 className="animate-spin" size={20} />
                    ) : vState === 'SUCCESS' ? (
                        <ShieldCheck size={20} />
                    ) : vState === 'ERROR' ? (
                        <AlertCircle size={20} />
                    ) : (
                        <Camera size={20} />
                    )}
                    <span className="text-sm font-semibold tracking-tight">{statusMessage}</span>
                </div>
            </div>

            {/* Success Overlay */}
            {vState === 'SUCCESS' && detectedName && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-green-500/10 animate-in fade-in duration-500">
                    <div className="bg-green-500 text-white p-4 rounded-full shadow-lg mb-4 animate-bounce">
                        <UserCheck size={48} />
                    </div>
                    <h3 className="text-3xl font-bold text-white drop-shadow-md">{detectedName}</h3>
                    <p className="text-green-400 font-medium mt-2">Giriş Onaylandı</p>
                </div>
            )}
        </div>
    );
};

export default FaceRecognition;
