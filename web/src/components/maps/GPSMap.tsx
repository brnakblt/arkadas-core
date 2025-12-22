'use client';

import { useEffect, useRef, useState } from 'react';

export interface MapMarker {
    id: string;
    latitude: number;
    longitude: number;
    title?: string;
    icon?: string;
    info?: string;
}

export interface MapRoute {
    id: string;
    points: { lat: number; lng: number }[];
    color?: string;
    width?: number;
}

interface GPSMapProps {
    center?: { lat: number; lng: number };
    zoom?: number;
    markers?: MapMarker[];
    routes?: MapRoute[];
    currentLocation?: { latitude: number; longitude: number } | null;
    showCurrentLocation?: boolean;
    onMarkerClick?: (marker: MapMarker) => void;
    onMapClick?: (lat: number, lng: number) => void;
    className?: string;
    height?: string;
}

// Default center: Arkadaş Özel Eğitim location (Turkey)
const DEFAULT_CENTER = { lat: 41.0082, lng: 28.9784 }; // Istanbul
const DEFAULT_ZOOM = 13;

export function GPSMap({
    center = DEFAULT_CENTER,
    zoom = DEFAULT_ZOOM,
    markers = [],
    routes = [],
    currentLocation,
    showCurrentLocation = true,
    onMarkerClick,
    onMapClick,
    className = '',
    height = '400px',
}: GPSMapProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<google.maps.Map | null>(null);
    const markersRef = useRef<google.maps.Marker[]>([]);
    const polylinesRef = useRef<google.maps.Polyline[]>([]);
    const currentLocationMarkerRef = useRef<google.maps.Marker | null>(null);

    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load Google Maps script
    useEffect(() => {
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

        if (!apiKey) {
            setError('Google Maps API key not configured');
            return;
        }

        if (window.google?.maps) {
            setIsLoaded(true);
            return;
        }

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
        script.async = true;
        script.defer = true;

        script.onload = () => setIsLoaded(true);
        script.onerror = () => setError('Failed to load Google Maps');

        document.head.appendChild(script);

        return () => {
            // Cleanup markers and polylines
            markersRef.current.forEach(m => m.setMap(null));
            polylinesRef.current.forEach(p => p.setMap(null));
            currentLocationMarkerRef.current?.setMap(null);
        };
    }, []);

    // Initialize map
    useEffect(() => {
        if (!isLoaded || !mapRef.current || mapInstanceRef.current) return;

        mapInstanceRef.current = new google.maps.Map(mapRef.current, {
            center,
            zoom,
            mapTypeControl: true,
            streetViewControl: false,
            fullscreenControl: true,
            zoomControl: true,
            styles: [
                {
                    featureType: 'poi',
                    elementType: 'labels',
                    stylers: [{ visibility: 'off' }],
                },
            ],
        });

        if (onMapClick) {
            mapInstanceRef.current.addListener('click', (e: google.maps.MapMouseEvent) => {
                if (e.latLng) {
                    onMapClick(e.latLng.lat(), e.latLng.lng());
                }
            });
        }
    }, [isLoaded, center, zoom, onMapClick]);

    // Update markers
    useEffect(() => {
        if (!mapInstanceRef.current || !isLoaded) return;

        // Clear existing markers
        markersRef.current.forEach(m => m.setMap(null));
        markersRef.current = [];

        // Add new markers
        markers.forEach(marker => {
            const gMarker = new google.maps.Marker({
                position: { lat: marker.latitude, lng: marker.longitude },
                map: mapInstanceRef.current,
                title: marker.title,
                icon: marker.icon || undefined,
            });

            if (marker.info) {
                const infoWindow = new google.maps.InfoWindow({
                    content: `<div class="p-2"><strong>${marker.title || ''}</strong><p>${marker.info}</p></div>`,
                });

                gMarker.addListener('click', () => {
                    infoWindow.open(mapInstanceRef.current, gMarker);
                    onMarkerClick?.(marker);
                });
            } else if (onMarkerClick) {
                gMarker.addListener('click', () => onMarkerClick(marker));
            }

            markersRef.current.push(gMarker);
        });
    }, [markers, isLoaded, onMarkerClick]);

    // Update routes
    useEffect(() => {
        if (!mapInstanceRef.current || !isLoaded) return;

        // Clear existing polylines
        polylinesRef.current.forEach(p => p.setMap(null));
        polylinesRef.current = [];

        // Add new routes
        routes.forEach(route => {
            const polyline = new google.maps.Polyline({
                path: route.points,
                geodesic: true,
                strokeColor: route.color || '#4285F4',
                strokeOpacity: 0.8,
                strokeWeight: route.width || 4,
                map: mapInstanceRef.current,
            });

            polylinesRef.current.push(polyline);
        });
    }, [routes, isLoaded]);

    // Update current location marker
    useEffect(() => {
        if (!mapInstanceRef.current || !isLoaded || !showCurrentLocation) return;

        if (currentLocation) {
            const position = { lat: currentLocation.latitude, lng: currentLocation.longitude };

            if (currentLocationMarkerRef.current) {
                currentLocationMarkerRef.current.setPosition(position);
            } else {
                currentLocationMarkerRef.current = new google.maps.Marker({
                    position,
                    map: mapInstanceRef.current,
                    icon: {
                        path: google.maps.SymbolPath.CIRCLE,
                        scale: 10,
                        fillColor: '#4285F4',
                        fillOpacity: 1,
                        strokeColor: '#ffffff',
                        strokeWeight: 3,
                    },
                    title: 'Your Location',
                    zIndex: 1000,
                });
            }

            // Pan to current location
            mapInstanceRef.current.panTo(position);
        }
    }, [currentLocation, isLoaded, showCurrentLocation]);

    if (error) {
        return (
            <div
                className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`}
                style={{ height }}
            >
                <div className="text-center text-gray-500">
                    <p className="text-lg font-medium">Harita Yüklenemedi</p>
                    <p className="text-sm">{error}</p>
                </div>
            </div>
        );
    }

    if (!isLoaded) {
        return (
            <div
                className={`flex items-center justify-center bg-gray-100 rounded-lg animate-pulse ${className}`}
                style={{ height }}
            >
                <div className="text-gray-400">Harita yükleniyor...</div>
            </div>
        );
    }

    return (
        <div
            ref={mapRef}
            className={`rounded-lg shadow-lg ${className}`}
            style={{ height, width: '100%' }}
        />
    );
}

export default GPSMap;
