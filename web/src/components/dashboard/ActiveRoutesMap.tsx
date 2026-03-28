'use client';

/**
 * Active Routes Map Widget - LAZY LOADED
 * 
 * Only loads Google Maps API when user scrolls to this component.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';

// ============================================================
// Types
// ============================================================

interface VehicleLocation {
    id: string;
    plateNumber: string;
    driverName: string;
    routeName: string;
    latitude: number;
    longitude: number;
    speed: number;
    heading: number;
    status: 'moving' | 'stopped' | 'idle';
    studentsOnboard: number;
    lastUpdate: Date;
    eta?: string;
}

interface RouteInfo {
    id: string;
    name: string;
    color: string;
    totalStudents: number;
    completedStops: number;
    totalStops: number;
}

interface ActiveRoutesMapProps {
    className?: string;
    refreshInterval?: number;
    onVehicleClick?: (vehicleId: string) => void;
    mapApiKey?: string;
}

// ============================================================
// Mock Data
// ============================================================

const mockVehicles: VehicleLocation[] = [
    {
        id: 'v1',
        plateNumber: '34 ARK 001',
        driverName: 'Ahmet Şoför',
        routeName: 'Güzergah A',
        latitude: 41.0082,
        longitude: 28.9784,
        speed: 35,
        heading: 90,
        status: 'moving',
        studentsOnboard: 8,
        lastUpdate: new Date(),
        eta: '5 dk',
    },
    {
        id: 'v2',
        plateNumber: '34 ARK 002',
        driverName: 'Mehmet Şoför',
        routeName: 'Güzergah B',
        latitude: 41.0122,
        longitude: 28.9854,
        speed: 0,
        heading: 180,
        status: 'stopped',
        studentsOnboard: 12,
        lastUpdate: new Date(),
    },
    {
        id: 'v3',
        plateNumber: '34 ARK 003',
        driverName: 'Can Şoför',
        routeName: 'Güzergah C',
        latitude: 41.0052,
        longitude: 28.9714,
        speed: 42,
        heading: 45,
        status: 'moving',
        studentsOnboard: 6,
        lastUpdate: new Date(),
        eta: '12 dk',
    },
];

const mockRoutes: RouteInfo[] = [
    { id: 'r1', name: 'Güzergah A', color: '#689F38', totalStudents: 15, completedStops: 5, totalStops: 8 },
    { id: 'r2', name: 'Güzergah B', color: '#E67E22', totalStudents: 18, completedStops: 10, totalStops: 10 },
    { id: 'r3', name: 'Güzergah C', color: '#A5D6A7', totalStudents: 12, completedStops: 3, totalStops: 7 },
];

// ============================================================
// Component
// ============================================================

export function ActiveRoutesMap({
    className = '',
    refreshInterval = 10,
    onVehicleClick,
    mapApiKey,
}: ActiveRoutesMapProps) {
    const [vehicles, setVehicles] = useState<VehicleLocation[]>([]);
    const [routes, setRoutes] = useState<RouteInfo[]>([]);
    const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const [isVisible, setIsVisible] = useState(false);
    const [shouldLoadMap, setShouldLoadMap] = useState(false);
    const [userWantsMap, setUserWantsMap] = useState(false);
    const mapContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsVisible(true);
                    }
                });
            },
            {
                root: null,
                rootMargin: '100px',
                threshold: 0.1,
            }
        );

        const currentContainer = mapContainerRef.current;
        if (currentContainer) {
            observer.observe(currentContainer);
        }

        return () => {
            if (currentContainer) {
                observer.unobserve(currentContainer);
            }
        };
    }, []);

    useEffect(() => {
        if (isVisible && userWantsMap && mapApiKey) {
            setShouldLoadMap(true);
        }
    }, [isVisible, userWantsMap, mapApiKey]);

    const fetchLocations = useCallback(async () => {
        try {
            const updatedVehicles = mockVehicles.map((v) => ({
                ...v,
                latitude: v.latitude + (Math.random() - 0.5) * 0.001,
                longitude: v.longitude + (Math.random() - 0.5) * 0.001,
                lastUpdate: new Date(),
            }));

            setVehicles(updatedVehicles);
            setRoutes(mockRoutes);
        } catch (error) {
            console.error('Failed to fetch vehicle locations:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLocations();
        const interval = setInterval(fetchLocations, refreshInterval * 1000);
        return () => clearInterval(interval);
    }, [fetchLocations, refreshInterval]);

    const handleVehicleSelect = (vehicleId: string) => {
        setSelectedVehicle(vehicleId);
        onVehicleClick?.(vehicleId);
    };

    const selectedVehicleData = vehicles.find((v) => v.id === selectedVehicle);

    return (
        <div ref={mapContainerRef} className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden ${className}`}>
            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-primary-dark px-6 py-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-white font-semibold text-lg">🚐 Aktif Servisler</h3>
                    <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 text-primary-light text-sm font-medium">
                            <span className="w-2 h-2 bg-secondary rounded-full animate-pulse" />
                            {vehicles.filter((v) => v.status === 'moving').length} hareket halinde
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row">
                {/* Map Area */}
                <div className="flex-1 relative">
                    {loading ? (
                        <div className="h-64 lg:h-80 flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                            <div className="text-center">
                                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                                <p className="text-sm text-gray-500 dark:text-gray-400">Yükleniyor...</p>
                            </div>
                        </div>
                    ) : !shouldLoadMap ? (
                        <div className="h-64 lg:h-80 bg-gradient-to-br from-primary/5 to-secondary/5 dark:from-gray-700 dark:to-gray-800 relative overflow-hidden">
                            <div className="absolute inset-0 opacity-20">
                                <svg className="w-full h-full">
                                    <defs>
                                        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
                                        </pattern>
                                    </defs>
                                    <rect width="100%" height="100%" fill="url(#grid)" />
                                </svg>
                            </div>

                            {vehicles.map((vehicle, index) => (
                                <button
                                    key={vehicle.id}
                                    className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${selectedVehicle === vehicle.id ? 'scale-125 z-10' : 'hover:scale-110'
                                        }`}
                                    style={{
                                        left: `${20 + index * 30}%`,
                                        top: `${30 + index * 15}%`,
                                    }}
                                    onClick={() => handleVehicleSelect(vehicle.id)}
                                >
                                    <div
                                        className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${vehicle.status === 'moving'
                                            ? 'bg-primary'
                                            : vehicle.status === 'stopped'
                                                ? 'bg-secondary'
                                                : 'bg-gray-500'
                                            }`}
                                    >
                                        <span className="text-white text-lg">🚐</span>
                                    </div>
                                    {vehicle.status === 'moving' && (
                                        <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-secondary rounded-full animate-ping" />
                                    )}
                                </button>
                            ))}

                            {!userWantsMap && isVisible && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-sm">
                                    <button
                                        onClick={() => setUserWantsMap(true)}
                                        className="bg-white dark:bg-gray-800 px-6 py-3 rounded-lg shadow-xl hover:shadow-2xl transition-all hover:scale-105 flex items-center gap-2 border border-primary/20"
                                    >
                                        <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                        </svg>
                                        <span className="font-semibold text-gray-800 dark:text-gray-200">
                                            Haritayı Yükle
                                        </span>
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="h-64 lg:h-80 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            <div className="text-center">
                                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                                <p className="text-gray-600 dark:text-gray-400">Google Maps yükleniyor...</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Vehicle List / Details */}
                <div className="lg:w-80 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-700">
                    {selectedVehicleData ? (
                        <div className="p-4">
                            <button
                                onClick={() => setSelectedVehicle(null)}
                                className="text-sm text-primary font-medium hover:underline mb-3 flex items-center gap-1"
                            >
                                ← Listeye Dön
                            </button>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`w-12 h-12 rounded-full flex items-center justify-center ${selectedVehicleData.status === 'moving'
                                            ? 'bg-primary/10 text-primary'
                                            : 'bg-secondary/10 text-secondary'
                                            }`}
                                    >
                                        <span className="text-2xl">🚐</span>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-800 dark:text-gray-200">
                                            {selectedVehicleData.plateNumber}
                                        </h4>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                                            {selectedVehicleData.routeName}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <InfoItem label="Şoför" value={selectedVehicleData.driverName} />
                                    <InfoItem label="Hız" value={`${selectedVehicleData.speed} km/s`} />
                                    <InfoItem label="Öğrenci" value={`${selectedVehicleData.studentsOnboard} kişi`} />
                                    <InfoItem
                                        label="Durum"
                                        value={
                                            selectedVehicleData.status === 'moving' ? 'Hareket' : 'Durdu'
                                        }
                                    />
                                </div>

                                {selectedVehicleData.eta && (
                                    <div className="p-3 bg-primary/5 dark:bg-primary/10 rounded-lg border border-primary/10">
                                        <p className="text-sm text-primary-dark dark:text-primary-light font-medium">
                                            ⏱️ Tahmini Varış: <strong>{selectedVehicleData.eta}</strong>
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="p-4">
                            <h4 className="font-bold text-gray-700 dark:text-gray-300 mb-3 text-xs uppercase tracking-widest">Aktif Araçlar</h4>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {vehicles.map((vehicle) => (
                                    <button
                                        key={vehicle.id}
                                        className="w-full p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left group"
                                        onClick={() => handleVehicleSelect(vehicle.id)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={`w-2 h-2 rounded-full ${vehicle.status === 'moving'
                                                        ? 'bg-primary'
                                                        : 'bg-secondary'
                                                        }`}
                                                />
                                                <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm group-hover:text-primary transition-colors">
                                                    {vehicle.plateNumber}
                                                </span>
                                            </div>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                {vehicle.studentsOnboard} öğrenci
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">
                                            {vehicle.routeName} • {vehicle.driverName}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50/30">
                        <h4 className="font-bold text-gray-700 dark:text-gray-300 mb-3 text-xs uppercase tracking-widest">
                            Güzergah Durumu
                        </h4>
                        <div className="space-y-3">
                            {routes.map((route) => (
                                <div key={route.id} className="space-y-1.5">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-gray-600 dark:text-gray-400 font-bold">{route.name}</span>
                                        <span className="text-gray-500 font-medium">{route.completedStops}/{route.totalStops} durak</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full transition-all duration-1000" 
                                            style={{ 
                                                width: `${(route.completedStops / route.totalStops) * 100}%`,
                                                backgroundColor: route.color 
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function InfoItem({ label, value }: { label: string; value: string }) {
    return (
        <div className="bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm">
            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-0.5">{label}</p>
            <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{value}</p>
        </div>
    );
}

export default ActiveRoutesMap;
