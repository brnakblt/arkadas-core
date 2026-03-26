"use client";

import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';
/* eslint-disable no-undef */
import { Camera, UserCheck, Loader2 } from 'lucide-react';

interface FaceRecognitionProps {
    onFaceDetected?: (descriptor: Float32Array) => void;
    mode?: 'register' | 'verify';
    knownDescriptors?: { label: string; descriptor: Float32Array }[];
}

const FaceRecognition: React.FC<FaceRecognitionProps> = ({ onFaceDetected, mode = 'verify', knownDescriptors = [] }) => {
    const webcamRef = useRef<Webcam>(null);
     
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [isScanning, setIsScanning] = useState(true);
    const [detectedName, setDetectedName] = useState<string | null>(null);

    useEffect(() => {
        const loadModels = async () => {
            const MODEL_URL = '/models';
            try {
                await Promise.all([
                    faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
                ]);
                setModelsLoaded(true);
            } catch (error) {
                console.error("Failed to load models:", error);
            }
        };
        loadModels();
    }, []);

    const handleVideoOnPlay = () => {
        const interval = setInterval(async () => {
            if (webcamRef.current && webcamRef.current.video && isScanning) {
                const video = webcamRef.current.video;

                // Safety check if video is ready
                if (video.readyState !== 4) return;

                const displaySize = { width: video.videoWidth, height: video.videoHeight };

                // Align canvas
                if (canvasRef.current) {
                    faceapi.matchDimensions(canvasRef.current, displaySize);
                }

                // Detect
                const detections = await faceapi.detectAllFaces(video).withFaceLandmarks().withFaceDescriptors();

                // Resize
                const resizedDetections = faceapi.resizeResults(detections, displaySize);

                // Draw
                if (canvasRef.current) {
                    const ctx = canvasRef.current.getContext('2d');
                    if (ctx) {
                        ctx.clearRect(0, 0, displaySize.width, displaySize.height);
                        faceapi.draw.drawDetections(canvasRef.current, resizedDetections);
                    }
                }

                // Recognition Logic
                if (resizedDetections.length > 0) {
                    const descriptor = resizedDetections[0].descriptor;

                    if (mode === 'register') {
                        if (onFaceDetected) {
                            onFaceDetected(descriptor);
                            setIsScanning(false); // Stop scanning after capture
                        }
                    } else {
                        // Verify
                        if (knownDescriptors.length > 0) {
                            const faceMatcher = new faceapi.FaceMatcher(knownDescriptors.map(d => new faceapi.LabeledFaceDescriptors(d.label, [d.descriptor])), 0.6);
                            const bestMatch = faceMatcher.findBestMatch(descriptor);

                            if (bestMatch.label !== 'unknown') {
                                setDetectedName(bestMatch.toString());
                                // Draw name box
                                if (canvasRef.current) {
                                    const box = resizedDetections[0].detection.box;
                                    const drawBox = new faceapi.draw.DrawBox(box, { label: bestMatch.toString() });
                                    drawBox.draw(canvasRef.current);
                                }
                            }
                        }
                    }
                }
            }
        }, 500); // 2 FPS check
        return () => clearInterval(interval);
    };

    return (
        <div className="relative w-full max-w-md mx-auto aspect-video rounded-xl overflow-hidden bg-slate-900 border-2 border-slate-700 shadow-xl">
            {!modelsLoaded && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-900/90 text-white">
                    <Loader2 className="animate-spin mb-2" size={32} />
                    <p>Yüz modelleri yükleniyor...</p>
                </div>
            )}

            <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                className="w-full h-full object-cover"
                onUserMedia={handleVideoOnPlay}
                mirrored={true}
            />

            <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full pointer-events-none" />

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
                {mode === 'register' && (
                    <button
                        onClick={() => setIsScanning(true)}
                        className="bg-blue-600 px-4 py-2 rounded-full text-white font-bold flex items-center gap-2 hover:bg-blue-700 transition"
                    >
                        <Camera size={20} /> Yüzü Kaydet
                    </button>
                )}
            </div>

            {detectedName && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-green-500/90 text-white px-4 py-1 rounded-full font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
                    <UserCheck size={18} /> {detectedName}
                </div>
            )}
        </div>
    );
};

export default FaceRecognition;
