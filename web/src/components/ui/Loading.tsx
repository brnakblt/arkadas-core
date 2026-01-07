'use client';

/**
 * Loading Components
 * 
 * Various loading indicators for different use cases:
 * - Spinner: Inline loading indicator
 * - PageLoader: Full page loading overlay
 * - ButtonLoader: Loading state for buttons
 * - ContentLoader: Loading state with optional message
 */

import React from 'react';

// ============================================================
// Spinner Component
// ============================================================

interface SpinnerProps {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    color?: 'primary' | 'secondary' | 'white' | 'current';
    className?: string;
}

const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3',
    xl: 'w-12 h-12 border-4',
};

const colorClasses = {
    primary: 'border-blue-600 border-t-transparent',
    secondary: 'border-gray-600 border-t-transparent',
    white: 'border-white border-t-transparent',
    current: 'border-current border-t-transparent',
};

export function Spinner({ size = 'md', color = 'primary', className = '' }: SpinnerProps) {
    return (
        <div
            className={`inline-block rounded-full animate-spin ${sizeClasses[size]} ${colorClasses[color]} ${className}`}
            role="status"
            aria-label="Yükleniyor"
        >
            <span className="sr-only">Yükleniyor...</span>
        </div>
    );
}

// ============================================================
// Page Loader Component
// ============================================================

interface PageLoaderProps {
    message?: string;
    transparent?: boolean;
}

export function PageLoader({ message = 'Yükleniyor...', transparent = false }: PageLoaderProps) {
    return (
        <div
            className={`fixed inset-0 z-50 flex flex-col items-center justify-center ${transparent ? 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm' : 'bg-white dark:bg-gray-900'
                }`}
            role="alert"
            aria-busy="true"
            aria-live="polite"
        >
            <div className="flex flex-col items-center gap-4">
                {/* Animated Logo/Spinner */}
                <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-gray-200 dark:border-gray-700" />
                    <div className="absolute top-0 left-0 w-16 h-16 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
                </div>

                {/* Message */}
                <p className="text-gray-600 dark:text-gray-400 font-medium animate-pulse">
                    {message}
                </p>
            </div>
        </div>
    );
}

// ============================================================
// Button Loader Component
// ============================================================

interface ButtonLoaderProps {
    loading?: boolean;
    children: React.ReactNode;
    loadingText?: string;
    className?: string;
}

export function ButtonLoader({
    loading = false,
    children,
    loadingText,
    className = '',
}: ButtonLoaderProps) {
    return (
        <span className={`inline-flex items-center gap-2 ${className}`}>
            {loading && <Spinner size="sm" color="current" />}
            <span>{loading && loadingText ? loadingText : children}</span>
        </span>
    );
}

// ============================================================
// Content Loader Component
// ============================================================

interface ContentLoaderProps {
    loading: boolean;
    children: React.ReactNode;
    message?: string;
    skeleton?: React.ReactNode;
    minHeight?: string;
    className?: string;
}

export function ContentLoader({
    loading,
    children,
    message = 'İçerik yükleniyor...',
    skeleton,
    minHeight = 'min-h-[200px]',
    className = '',
}: ContentLoaderProps) {
    if (loading) {
        if (skeleton) {
            return <>{skeleton}</>;
        }

        return (
            <div
                className={`flex flex-col items-center justify-center ${minHeight} ${className}`}
                role="status"
                aria-label={message}
            >
                <Spinner size="lg" />
                <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">{message}</p>
            </div>
        );
    }

    return <>{children}</>;
}

// ============================================================
// Inline Loader Component
// ============================================================

interface InlineLoaderProps {
    text?: string;
    className?: string;
}

export function InlineLoader({ text = 'Yükleniyor...', className = '' }: InlineLoaderProps) {
    return (
        <span className={`inline-flex items-center gap-2 text-gray-500 ${className}`}>
            <Spinner size="sm" color="current" />
            <span className="text-sm">{text}</span>
        </span>
    );
}

// ============================================================
// Progress Bar Component
// ============================================================

interface ProgressBarProps {
    progress: number; // 0-100
    showLabel?: boolean;
    size?: 'sm' | 'md' | 'lg';
    color?: 'primary' | 'success' | 'warning' | 'error';
    animated?: boolean;
    className?: string;
}

const progressSizes = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-4',
};

const progressColors = {
    primary: 'bg-blue-600',
    success: 'bg-green-600',
    warning: 'bg-yellow-500',
    error: 'bg-red-600',
};

export function ProgressBar({
    progress,
    showLabel = false,
    size = 'md',
    color = 'primary',
    animated = true,
    className = '',
}: ProgressBarProps) {
    const clampedProgress = Math.min(100, Math.max(0, progress));

    return (
        <div className={`w-full ${className}`}>
            <div
                className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden ${progressSizes[size]}`}
                role="progressbar"
                aria-valuenow={clampedProgress}
                aria-valuemin={0}
                aria-valuemax={100}
            >
                <div
                    className={`${progressSizes[size]} ${progressColors[color]} rounded-full transition-all duration-300 ${animated && clampedProgress < 100 ? 'animate-pulse' : ''
                        }`}
                    style={{ width: `${clampedProgress}%` }}
                />
            </div>
            {showLabel && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
                    %{Math.round(clampedProgress)}
                </p>
            )}
        </div>
    );
}

// ============================================================
// Dots Loader Component
// ============================================================

interface DotsLoaderProps {
    color?: 'primary' | 'secondary' | 'white';
    size?: 'sm' | 'md' | 'lg';
}

const dotSizes = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-3 h-3',
};

const dotColors = {
    primary: 'bg-blue-600',
    secondary: 'bg-gray-600',
    white: 'bg-white',
};

export function DotsLoader({ color = 'primary', size = 'md' }: DotsLoaderProps) {
    return (
        <div className="flex items-center gap-1" role="status" aria-label="Yükleniyor">
            {[0, 1, 2].map((i) => (
                <div
                    key={i}
                    className={`${dotSizes[size]} ${dotColors[color]} rounded-full animate-bounce`}
                    style={{ animationDelay: `${i * 150}ms` }}
                />
            ))}
            <span className="sr-only">Yükleniyor...</span>
        </div>
    );
}

// ============================================================
// Skeleton Loader Wrapper
// ============================================================

interface SkeletonLoaderProps {
    loading: boolean;
    children: React.ReactNode;
    skeleton: React.ReactNode;
}

export function SkeletonLoader({ loading, children, skeleton }: SkeletonLoaderProps) {
    return loading ? <>{skeleton}</> : <>{children}</>;
}

// ============================================================
// Export all components
// ============================================================

export default {
    Spinner,
    PageLoader,
    ButtonLoader,
    ContentLoader,
    InlineLoader,
    ProgressBar,
    DotsLoader,
    SkeletonLoader,
};
