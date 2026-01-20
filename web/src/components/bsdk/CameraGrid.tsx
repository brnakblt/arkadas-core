
"use client";

import React, { useState, useEffect } from 'react';
import { Video, Wifi, WifiOff, AlertCircle } from 'lucide-react';

interface Camera {
    id: string;
    label: string;
    plate: string;
    status: 'online' | 'offline' | 'error';
    src: string;
}

const SAMPLE_VIDEOS = [
    "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4"
];

const CameraFeed: React.FC<{ camera: Camera }> = ({ camera }) => {
    return (
        <div className="relative bg-black aspect-video rounded-lg overflow-hidden border border-slate-800 group">
            {camera.status === 'online' ? (
                <video
                    src={camera.src}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                />
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-500">
                    {camera.status === 'offline' ? <WifiOff size={32} /> : <AlertCircle size={32} className="text-red-500" />}
                    <p className="mt-2 text-xs font-mono">{camera.status.toUpperCase()}</p>
                </div>
            )}

            {/* Overlay */}
            <div className="absolute top-2 left-2 bg-black/60 text-white px-2 py-1 rounded text-xs font-mono flex items-center gap-2">
                <Video size={12} className={camera.status === 'online' ? "text-green-500 animate-pulse" : "text-red-500"} />
                {camera.label}
            </div>

            <div className="absolute top-2 right-2 bg-black/60 text-white px-2 py-1 rounded text-xs font-mono">
                {camera.plate}
            </div>

            <div className="absolute bottom-2 left-2 text-white/80 text-[10px] font-mono">
                {new Date().toLocaleDateString()}
            </div>
            {/* Mock Timestamp that updates */}
            <LiveTimestamp />
        </div>
    );
};

const LiveTimestamp = () => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="absolute bottom-2 right-2 text-white/80 text-[10px] font-mono bg-black/40 px-1 rounded">
            {time.toLocaleTimeString()}
        </div>
    );
}

const CameraGrid: React.FC = () => {
    const [cameras, setCameras] = useState<Camera[]>([]);

    useEffect(() => {
        // Generate Mock Cameras
        const mocks: Camera[] = Array.from({ length: 12 }).map((_, i) => ({
            id: `cam-${i + 1}`,
            label: `CAM-${(i + 1).toString().padStart(2, '0')}`,
            plate: `34 ABC ${100 + i}`,
            status: Math.random() > 0.1 ? 'online' : 'offline',
            src: SAMPLE_VIDEOS[i % SAMPLE_VIDEOS.length]
        }));
        setCameras(mocks);
    }, []);

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {cameras.map(cam => (
                <CameraFeed key={cam.id} camera={cam} />
            ))}
        </div>
    );
};

export default CameraGrid;
