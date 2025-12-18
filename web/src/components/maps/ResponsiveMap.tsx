'use client';

import { useState, useEffect, useRef, ReactNode } from 'react';
import Image from 'next/image';

interface ResponsiveMapProps {
    src: string;
    title?: string;
    aspectRatio?: '16/9' | '4/3' | '1/1' | 'full';
    minHeight?: number;
    maxHeight?: number;
    className?: string;
    loading?: 'lazy' | 'eager';
    onLoad?: () => void;
    onError?: () => void;
    fallback?: ReactNode;
}

/**
 * Responsive Map Container
 * Adapts iframe/map to container and window size
 */
export default function ResponsiveMap({
    src,
    title = 'Harita',
    aspectRatio = '16/9',
    minHeight = 300,
    maxHeight = 800,
    className = '',
    loading = 'lazy',
    onLoad,
    onError,
    fallback,
}: ResponsiveMapProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [containerHeight, setContainerHeight] = useState<number>(400);
    const containerRef = useRef<HTMLDivElement>(null);

    // Calculate height based on aspect ratio and container width
    useEffect(() => {
        const calculateHeight = () => {
            if (!containerRef.current) return;

            const width = containerRef.current.offsetWidth;
            let height: number;

            if (aspectRatio === 'full') {
                // Full viewport height minus header/footer
                height = window.innerHeight - 200;
            } else {
                const [w, h] = aspectRatio.split('/').map(Number);
                height = (width * h) / w;
            }

            // Clamp between min and max
            height = Math.max(minHeight, Math.min(maxHeight, height));
            setContainerHeight(height);
        };

        calculateHeight();

        // Recalculate on resize
        const resizeObserver = new ResizeObserver(calculateHeight);
        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        window.addEventListener('resize', calculateHeight);
        return () => {
            resizeObserver.disconnect();
            window.removeEventListener('resize', calculateHeight);
        };
    }, [aspectRatio, minHeight, maxHeight]);

    const handleLoad = () => {
        setIsLoading(false);
        onLoad?.();
    };

    const handleError = () => {
        setIsLoading(false);
        setHasError(true);
        onError?.();
    };

    if (hasError) {
        return (
            <div
                ref={containerRef}
                className={`bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center ${className}`}
                style={{ height: containerHeight }}
            >
                {fallback || (
                    <div className="text-center p-8">
                        <span className="text-4xl mb-4 block">🗺️</span>
                        <p className="text-gray-500 dark:text-gray-400 mb-4">
                            Harita yüklenemedi
                        </p>
                        <button
                            onClick={() => {
                                setHasError(false);
                                setIsLoading(true);
                            }}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                            Tekrar Dene
                        </button>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className={`relative overflow-hidden rounded-xl ${className}`}
            style={{ height: containerHeight }}
        >
            {/* Loading State */}
            {isLoading && (
                <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center z-10">
                    <div className="text-center">
                        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                            Harita yükleniyor...
                        </p>
                    </div>
                </div>
            )}

            {/* Map Iframe */}
            <iframe
                src={src}
                title={title}
                loading={loading}
                onLoad={handleLoad}
                onError={handleError}
                className="w-full h-full border-0"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
            />
        </div>
    );
}

/**
 * Google Maps Embed
 */
export function GoogleMapsEmbed({
    query,
    apiKey,
    zoom = 15,
    mapType = 'roadmap',
    className = '',
    ...props
}: {
    query: string;
    apiKey?: string;
    zoom?: number;
    mapType?: 'roadmap' | 'satellite';
    className?: string;
} & Partial<ResponsiveMapProps>) {
    const key = apiKey || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    // If no API key, use the embed URL (limited features)
    const src = key
        ? `https://www.google.com/maps/embed/v1/place?key=${key}&q=${encodeURIComponent(query)}&zoom=${zoom}&maptype=${mapType}`
        : `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=&z=${zoom}&ie=UTF8&iwloc=&output=embed`;

    return (
        <ResponsiveMap
            src={src}
            title={`Harita: ${query}`}
            className={className}
            {...props}
        />
    );
}

/**
 * OpenStreetMap Embed
 */
export function OpenStreetMapEmbed({
    latitude,
    longitude,
    _zoom = 15,
    marker = true,
    className = '',
    ...props
}: {
    latitude: number;
    longitude: number;
    zoom?: number;
    marker?: boolean;
    className?: string;
} & Partial<ResponsiveMapProps>) {
    const markerParam = marker ? `&marker=${latitude},${longitude}` : '';
    const src = `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.01},${latitude - 0.01},${longitude + 0.01},${latitude + 0.01}&layer=mapnik${markerParam}`;

    return (
        <ResponsiveMap
            src={src}
            title="OpenStreetMap"
            className={className}
            {...props}
        />
    );
}

/**
 * Static Map Image (Google Static Maps API)
 * For simple, non-interactive maps
 */
export function StaticMap({
    center,
    zoom = 15,
    width = 600,
    height = 400,
    markers,
    apiKey,
    className = '',
}: {
    center: string | { lat: number; lng: number };
    zoom?: number;
    width?: number;
    height?: number;
    markers?: { lat: number; lng: number; color?: string }[];
    apiKey?: string;
    className?: string;
}) {
    const key = apiKey || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!key) {
        return (
            <div className={`bg-gray-100 rounded-xl flex items-center justify-center ${className}`} style={{ width, height }}>
                <p className="text-gray-500">API key required</p>
            </div>
        );
    }

    const centerStr = typeof center === 'string' ? center : `${center.lat},${center.lng}`;
    const markerStr = markers?.map(m => `markers=color:${m.color || 'red'}|${m.lat},${m.lng}`).join('&') || '';

    const src = `https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(centerStr)}&zoom=${zoom}&size=${width}x${height}&${markerStr}&key=${key}`;

    return (
        <Image
            src={src}
            alt="Map"
            width={width}
            height={height}
            className={`rounded-xl ${className}`}
        />
    );
}
