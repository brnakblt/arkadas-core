'use client';

import { useState, useEffect } from 'react';
import { useDriverTracking } from '@/hooks/useDriverTracking';
import { getStrapiURL } from '@/lib/api';

interface SimpleRoute {
    id: string;
    attributes: {
        name: string;
        vehiclePlate: string;
    }
}

export default function DriverPage() {
    const [routes, setRoutes] = useState<SimpleRoute[]>([]);
    const [selectedRouteId, setSelectedRouteId] = useState<string>('');
    const [loading, setLoading] = useState(true);

    const {
        isTracking,
        location,
        lastSentTime,
        totalSent,
        error,
        startTracking,
        stopTracking
    } = useDriverTracking({
        routeId: selectedRouteId,
        updateInterval: 10000 // Send every 10 seconds
    });

    // Fetch routes on mount
    useEffect(() => {
        const fetchRoutes = async () => {
            try {
                const token = localStorage.getItem('jwt');
                const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};

                // Fetch routes, ideally filtered by current user if they are a driver
                // For now fetching all active routes
                const res = await fetch(`${getStrapiURL()}/api/service-routes?filters[isActive][$eq]=true`, { headers });
                const json = await res.json();

                if (json.data) {
                    setRoutes(json.data);
                }
            } catch (err) {
                console.error('Failed to fetch routes', err);
            } finally {
                setLoading(false);
            }
        };

        fetchRoutes();
    }, []);

    const handleToggleTracking = () => {
        if (isTracking) {
            stopTracking();
        } else {
            if (!selectedRouteId) return;
            startTracking();
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-4">
            <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden p-6 space-y-6">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900">Sürücü Paneli</h1>
                    <p className="text-gray-500">Servis Takip Sistemi</p>
                </div>

                {!isTracking && (
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Sefer Seçiniz</label>
                        <select
                            value={selectedRouteId}
                            onChange={(e) => setSelectedRouteId(e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 border"
                            disabled={loading}
                        >
                            <option value="">Seçiniz...</option>
                            {routes.map(route => (
                                <option key={route.id} value={route.id}>
                                    {route.attributes.name} ({route.attributes.vehiclePlate})
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {selectedRouteId && (
                    <div className="flex flex-col items-center space-y-4">
                        <button
                            onClick={handleToggleTracking}
                            className={`w-full py-4 px-6 rounded-full font-bold text-lg shadow-lg transition-transform active:scale-95 ${isTracking
                                ? 'bg-red-500 hover:bg-red-600 text-white'
                                : 'bg-green-500 hover:bg-green-600 text-white'
                                }`}
                        >
                            {isTracking ? '🏁 SEFERİ BİTİR' : '▶️ SEFERİ BAŞLAT'}
                        </button>

                        {isTracking && (
                            <div className="w-full bg-blue-50 p-4 rounded-lg space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Durum:</span>
                                    <span className="font-medium text-green-600 animate-pulse">Aktif Takip</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Gönderilen Konum:</span>
                                    <span className="font-medium">{totalSent}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Son Güncelleme:</span>
                                    <span className="font-medium">
                                        {lastSentTime ? lastSentTime.toLocaleTimeString() : '-'}
                                    </span>
                                </div>
                                {location && (
                                    <div className="text-xs text-gray-400 font-mono mt-2 text-center">
                                        {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                                    </div>
                                )}
                            </div>
                        )}

                        {error && (
                            <div className="w-full bg-red-50 text-red-600 p-3 rounded text-sm">
                                ⚠️ {error}
                            </div>
                        )}
                    </div>
                )}

                <div className="text-xs text-center text-gray-400 mt-8">
                    GPS izni gereklidir. Ekran açık kaldığı sürece konum gönderilir.
                </div>
            </div>
        </div>
    );
}
