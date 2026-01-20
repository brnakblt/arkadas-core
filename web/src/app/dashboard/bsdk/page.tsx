
"use client";

import React from 'react';
import CameraGrid from '@/components/bsdk/CameraGrid';
import { Car, Activity, Server } from 'lucide-react';

const BSDKPage: React.FC = () => {
    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Car className="text-blue-600" />
                        BSDK İzleme Merkezi
                    </h1>
                    <p className="text-slate-500">Sürücü kursu araçlarının gerçek zamanlı IP kamera simülasyonu.</p>
                </div>

                <div className="flex gap-4">
                    <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 flex items-center gap-3">
                        <Activity className="text-green-500" size={20} />
                        <div>
                            <p className="text-xs text-slate-500 font-bold uppercase">Sistem Durumu</p>
                            <p className="text-sm font-bold text-slate-800">Normal</p>
                        </div>
                    </div>
                    <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 flex items-center gap-3">
                        <Server className="text-blue-500" size={20} />
                        <div>
                            <p className="text-xs text-slate-500 font-bold uppercase">Bağlı Araç</p>
                            <p className="text-sm font-bold text-slate-800">10/12</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-slate-900 p-4 rounded-xl shadow-lg border border-slate-800">
                <CameraGrid />
            </div>
        </div>
    );
};

export default BSDKPage;
