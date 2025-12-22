'use client';

import { lazy, Suspense, ComponentType } from 'react';
import { useState, useEffect, useRef } from 'react';

/**
 * Loading fallback component
 */
function LoadingFallback() {
    return (
        <div className="flex items-center justify-center min-h-[200px]">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );
}

/**
 * Create a lazy-loaded component with loading fallback
 */
export function lazyLoad<P extends object>(
    importFn: () => Promise<{ default: ComponentType<P> }>,
    fallback?: React.ReactNode
) {
    const LazyComponent = lazy(importFn);

    return function LazyWrapper(props: P) {
        return (
            <Suspense fallback={fallback ?? <LoadingFallback />}>
                <LazyComponent {...props} />
            </Suspense>
        );
    };
}

/**
 * Page loading fallback
 */
export function PageLoadingFallback() {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
                <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-500">Sayfa yükleniyor...</p>
            </div>
        </div>
    );
}

/**
 * Preload a component
 */
export function preloadComponent(importFn: () => Promise<unknown>) {
    importFn();
}

/**
 * Intersection Observer based lazy loading hook
 */
export function useLazyLoad(threshold: number = 0.1) {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { threshold }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => observer.disconnect();
    }, [threshold]);

    return { ref, isVisible };
}

/**
 * Lazy loaded section wrapper
 */
export function LazySection({
    children,
    fallback,
    className = '',
}: {
    children: React.ReactNode;
    fallback?: React.ReactNode;
    className?: string;
}) {
    const { ref, isVisible } = useLazyLoad();

    return (
        <div ref={ref} className={className}>
            {isVisible ? children : (fallback ?? <LoadingFallback />)}
        </div>
    );
}

/**
 * Placeholder components for lazy loading
 */
export function MapPlaceholder() {
    return (
        <div className="bg-gray-100 dark:bg-gray-800 animate-pulse rounded-xl h-96 flex items-center justify-center">
            <span className="text-gray-400">🗺️ Harita yükleniyor...</span>
        </div>
    );
}

export function CalendarPlaceholder() {
    return (
        <div className="bg-gray-100 dark:bg-gray-800 animate-pulse rounded-xl h-96 flex items-center justify-center">
            <span className="text-gray-400">📅 Takvim yükleniyor...</span>
        </div>
    );
}

export function EditorPlaceholder() {
    return (
        <div className="bg-gray-100 dark:bg-gray-800 animate-pulse rounded-xl h-96 flex items-center justify-center">
            <span className="text-gray-400">📝 Düzenleyici yükleniyor...</span>
        </div>
    );
}
