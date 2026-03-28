'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import GPSMap, { MapMarker } from '@/components/maps/GPSMap';
import { useGPSTracking } from '@/hooks/useGPSTracking';
import { getStrapiURL } from '@/lib/api';
import { calculateDelay, RouteStop } from '@/utils/delayEstimation';

interface ServiceRoute {
    id: string;
    originalId: string; // Strapi ID
    name: string;
    vehiclePlate: string;
    driverName: string;
    status: 'not_started' | 'in_progress' | 'completed';
    stops: ServiceStop[];
    currentLocation?: {
        latitude: number;
        longitude: number;
        updatedAt: string;
        speed?: number;
    };
}

interface ServiceStop extends RouteStop {
    name: string;
    status: 'pending' | 'arrived' | 'departed';
    delayMinutes?: number;
}

interface StrapiAttributes {
    [key: string]: unknown;
}

interface StrapiData<T = StrapiAttributes> {
    id: number;
    attributes: T;
}

interface StrapiResponse<T = StrapiAttributes> {
    data: StrapiData<T>[];
}

interface RouteAttributes {
    name: string;
    vehiclePlate: string;
    isActive: boolean;
    driver?: {
        data?: StrapiData<{
            username: string;
        }>;
    };
    stops?: {
        data: StrapiData<{
            name: string;
            latitude: number;
            longitude: number;
            order: number;
            estimatedTime: string;
        }>[];
    };
}

interface LocationAttributes {
    latitude: number;
    longitude: number;
    recordedAt: string;
    speedKmh?: number;
}

export default function ServiceTrackingPage() {
    const [routes, setRoutes] = useState<ServiceRoute[]>([]);
    const [selectedRoute, setSelectedRoute] = useState<ServiceRoute | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
    const [autoRefresh, setAutoRefresh] = useState(true);

    const { location: myLocation, isTracking, startTracking, stopTracking } = useGPSTracking({
        updateInterval: 5000,
    });

    const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Fetch initial routes
    const fetchRoutes = useCallback(async () => {
        try {
            const res = await fetch(`${getStrapiURL()}/api/service-routes?populate=*&filters[isActive][$eq]=true`);
            const json = (await res.json()) as StrapiResponse<RouteAttributes>;

            if (!json.data) return;

            const mappedRoutes: ServiceRoute[] = await Promise.all(json.data.map(async (item) => {
                const attrs = item.attributes;

                // Fetch latest location for this route
                let currentLocation: ServiceRoute['currentLocation'] = undefined;
                try {
                    const locRes = await fetch(`${getStrapiURL()}/api/location-logs?filters[route][id][$eq]=${item.id}&sort[0]=createdAt:desc&pagination[limit]=1`);
                    const locJson = (await locRes.json()) as StrapiResponse<LocationAttributes>;
                    if (locJson.data && locJson.data.length > 0) {
                        const loc = locJson.data[0].attributes;
                        currentLocation = {
                            latitude: loc.latitude,
                            longitude: loc.longitude,
                            updatedAt: loc.recordedAt,
                            speed: loc.speedKmh
                        };
                    }
                } catch (e) {
                    console.error("Loc fetch error", e);
                }

                // Map stops
                const stops: ServiceStop[] = (attrs.stops?.data || []).map((stop) => ({
                    id: stop.id.toString(),
                    name: stop.attributes.name,
                    latitude: stop.attributes.latitude,
                    longitude: stop.attributes.longitude,
                    order: stop.attributes.order,
                    estimatedTime: stop.attributes.estimatedTime,
                    status: 'pending' as const, // Default
                    delayMinutes: 0
                })).sort((a, b) => a.order - b.order);

                // Calculate statuses and delays if we have location
                if (currentLocation) {
                    stops.forEach(stop => {
                        stop.delayMinutes = calculateDelay(
                            { latitude: currentLocation?.latitude ?? 0, longitude: currentLocation?.longitude ?? 0 },
                            stop
                        );
                    });
                }

                return {
                    id: item.id.toString(),
                    originalId: item.id.toString(),
                    name: attrs.name,
                    vehiclePlate: attrs.vehiclePlate,
                    driverName: attrs.driver?.data?.attributes?.username || 'Sürücü',
                    status: currentLocation ? 'in_progress' : 'not_started',
                    stops: stops,
                    currentLocation
                } as ServiceRoute;
            }));

            setRoutes(mappedRoutes);
            setLastUpdate(new Date());

            // Update selected route if exists
            if (selectedRoute) {
                const updated = mappedRoutes.find(r => r.id === selectedRoute.id);
                if (updated) setSelectedRoute(updated);
            }

        } catch (error) {
            console.error("Error fetching routes:", error);
        } finally {
            setLoading(false);
        }
    }, [selectedRoute]);

    useEffect(() => {
        fetchRoutes();

        if (autoRefresh) {
            refreshTimerRef.current = setInterval(fetchRoutes, 10000); // 10 seconds refresh
        }

        return () => {
            if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
        };
    }, [autoRefresh, fetchRoutes]);

    const mapMarkers: MapMarker[] = selectedRoute
        ? selectedRoute.stops.map(stop => ({
            id: stop.id,
            latitude: stop.latitude,
            longitude: stop.longitude,
            title: stop.name,
            info: `${stop.estimatedTime} ${stop.delayMinutes && stop.delayMinutes > 5 ? `(+${stop.delayMinutes}dk gecikme)` : ''}`,
            icon: '⚪', // Could be dynamic based on status
        }))
        : routes.filter(r => r.currentLocation).map(route => ({
            id: route.id,
            latitude: route.currentLocation?.latitude ?? 0,
            longitude: route.currentLocation?.longitude ?? 0,
            title: route.name,
            info: `${route.vehiclePlate} - ${route.driverName}`,
        }));

    // Add vehicle marker for selected route
    if (selectedRoute && selectedRoute.currentLocation) {
        mapMarkers.push({
            id: 'vehicle-' + selectedRoute.id,
            latitude: selectedRoute.currentLocation.latitude,
            longitude: selectedRoute.currentLocation.longitude,
            title: selectedRoute.name,
            info: `Hız: ${Math.round(selectedRoute.currentLocation.speed || 0)} km/s`,
            icon: '🚌'
        });
    }

    const mapRoutesData = selectedRoute
        ? [{
            id: selectedRoute.id,
            points: selectedRoute.stops.map(s => ({ lat: s.latitude, lng: s.longitude })),
            color: '#4285F4',
            width: 4,
        }]
        : [];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                🚌 Servis Takip
                            </h1>
                            <p className="text-xs text-gray-500">
                                Son güncelleme: {lastUpdate.toLocaleTimeString()}
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setAutoRefresh(!autoRefresh)}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${autoRefresh
                                    ? 'bg-green-500 text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                            >
                                {autoRefresh ? '♻️ Otomatik' : '⏸️ Duraklatıldı'}
                            </button>
                            <button
                                onClick={isTracking ? stopTracking : startTracking}
                                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                            >
                                {isTracking ? '📍 Konumum Kapalı' : '📍 Konumumu Göster'}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Route List */}
                    <div className="lg:col-span-1 space-y-4">
                        <h2 className="text-lg font-semibold text-gray-900">Aktif Servisler</h2>

                        {loading && <div className="text-center py-4">Servisler yükleniyor...</div>}

                        {!loading && routes.length === 0 && (
                            <div className="text-center py-4 text-gray-500">Aktif servis bulunamadı.</div>
                        )}

                        {routes.map(route => (
                            <div
                                key={route.id}
                                onClick={() => setSelectedRoute(selectedRoute?.id === route.id ? null : route)}
                                className={`p-4 bg-white rounded-xl shadow-sm border-2 cursor-pointer transition-all hover:shadow-md ${selectedRoute?.id === route.id
                                    ? 'border-blue-500'
                                    : 'border-transparent'
                                    }`}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{route.name}</h3>
                                        <p className="text-sm text-gray-500">{route.vehiclePlate}</p>
                                        <p className="text-sm text-gray-500">👤 {route.driverName}</p>
                                    </div>
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${route.status === 'in_progress'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-gray-100 text-gray-800'
                                        }`}>
                                        {route.status === 'in_progress' ? 'Yolda' : 'Bekliyor'}
                                    </span>
                                </div>

                                {route.currentLocation && (
                                    <p className="text-xs text-gray-400 mt-2">
                                        Konum: {new Date(route.currentLocation.updatedAt).toLocaleTimeString('tr-TR')}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Map */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-xl shadow-sm p-4">
                            <GPSMap
                                markers={mapMarkers}
                                routes={mapRoutesData}
                                currentLocation={selectedRoute?.currentLocation
                                    ? { latitude: selectedRoute.currentLocation.latitude, longitude: selectedRoute.currentLocation.longitude }
                                    : (myLocation ? { latitude: myLocation.latitude, longitude: myLocation.longitude } : null)}
                                showCurrentLocation={true}
                                height="500px"
                                className="gps-map rounded-lg overflow-hidden"
                                onMarkerClick={(marker) => {
                                    const route = routes.find(r => r.id === marker.id);
                                    if (route) setSelectedRoute(route);
                                }}
                            />
                        </div>

                        {/* Selected Route Stops */}
                        {selectedRoute && (
                            <div className="mt-4 bg-white rounded-xl shadow-sm p-4">
                                <h3 className="font-semibold text-gray-900 mb-4">
                                    {selectedRoute.name} - Duraklar
                                </h3>
                                <div className="space-y-3">
                                    {selectedRoute.stops.map((stop, index) => (
                                        <div
                                            key={stop.id}
                                            className="flex items-center gap-3"
                                        >
                                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium bg-blue-500">
                                                {index + 1}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-900">{stop.name}</p>
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-gray-500">
                                                        Tahmini: {stop.estimatedTime}
                                                    </span>
                                                    {stop.delayMinutes !== undefined && Math.abs(stop.delayMinutes) > 2 && (
                                                        <span className={stop.delayMinutes > 0 ? "text-red-500" : "text-green-500"}>
                                                            {stop.delayMinutes > 0 ? `+${stop.delayMinutes}dk gecikme` : `${Math.abs(stop.delayMinutes)}dk erken`}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
