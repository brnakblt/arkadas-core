'use client';

import { } from 'react';

interface SkeletonProps {
    className?: string;
    animate?: boolean;
}

/**
 * Base Skeleton Component – animated placeholder
 */
export function Skeleton({ className = '', animate = true }: SkeletonProps) {
    return (
        <div
            className={`bg-gray-200 rounded ${animate ? 'animate-pulse' : ''} ${className}`}
        />
    );
}

/**
 * Text Skeleton – for text lines
 */
export function SkeletonText({ lines = 3, className = '' }: { lines?: number; className?: string }) {
    return (
        <div className={`space-y-2 ${className}`}>
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton
                    key={i}
                    className={`h-4 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`}
                />
            ))}
        </div>
    );
}

/**
 * Card Skeleton – for content cards
 */
export function SkeletonCard({ className = '' }: { className?: string }) {
    return (
        <div className={`bg-white rounded-xl p-5 shadow-sm ${className}`}>
            <Skeleton className="h-10 w-10 rounded-lg mb-4" />
            <Skeleton className="h-5 w-2/3 mb-2" />
            <Skeleton className="h-4 w-full mb-1" />
            <Skeleton className="h-4 w-3/4" />
        </div>
    );
}

/**
 * Table Row Skeleton
 */
export function SkeletonTableRow({ columns = 5 }: { columns?: number }) {
    return (
        <tr className="animate-pulse">
            {Array.from({ length: columns }).map((_, i) => (
                <td key={i} className="py-4 px-5">
                    <Skeleton className={`h-4 ${i === 0 ? 'w-32' : 'w-20'}`} />
                </td>
            ))}
        </tr>
    );
}

/**
 * Table Skeleton – full table with multiple rows
 */
export function SkeletonTable({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
    return (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            {Array.from({ length: columns }).map((_, i) => (
                                <th key={i} className="py-4 px-5">
                                    <Skeleton className="h-4 w-20" />
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {Array.from({ length: rows }).map((_, i) => (
                            <SkeletonTableRow key={i} columns={columns} />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

/**
 * Stats Card Skeleton – for dashboard stats
 */
export function SkeletonStats({ count = 4 }: { count?: number }) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl p-5 shadow-sm animate-pulse">
                    <Skeleton className="h-3 w-16 mb-2" />
                    <Skeleton className="h-8 w-12" />
                </div>
            ))}
        </div>
    );
}

/**
 * Calendar Skeleton – for schedule views
 */
export function SkeletonCalendar() {
    return (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden animate-pulse">
            {/* Header */}
            <div className="px-6 py-4 border-b flex justify-between items-center">
                <Skeleton className="h-6 w-48" />
                <div className="flex gap-2">
                    <Skeleton className="h-8 w-8 rounded" />
                    <Skeleton className="h-8 w-16 rounded" />
                    <Skeleton className="h-8 w-8 rounded" />
                </div>
            </div>
            {/* Grid */}
            <div className="grid grid-cols-7 gap-px bg-gray-200">
                {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="bg-gray-50 p-3">
                        <Skeleton className="h-4 w-8 mx-auto" />
                    </div>
                ))}
                {Array.from({ length: 35 }).map((_, i) => (
                    <div key={i} className="bg-white min-h-[80px] p-2">
                        <Skeleton className="h-4 w-6 mb-2" />
                        {i % 5 === 0 && <Skeleton className="h-5 w-full rounded" />}
                    </div>
                ))}
            </div>
        </div>
    );
}

/**
 * Map Skeleton – for GPS tracking views
 */
export function SkeletonMap({ className = '' }: { className?: string }) {
    return (
        <div className={`bg-gray-100 rounded-xl overflow-hidden animate-pulse ${className}`}>
            <div className="aspect-[4/3] flex items-center justify-center">
                <div className="text-center">
                    <span className="text-4xl opacity-30">🗺️</span>
                    <p className="text-gray-400 text-sm mt-2">Harita yükleniyor...</p>
                </div>
            </div>
        </div>
    );
}

/**
 * Profile Skeleton – for user profiles
 */
export function SkeletonProfile() {
    return (
        <div className="bg-white rounded-xl p-6 shadow-sm animate-pulse">
            <div className="flex items-center gap-4 mb-6">
                <Skeleton className="w-16 h-16 rounded-full" />
                <div>
                    <Skeleton className="h-5 w-32 mb-2" />
                    <Skeleton className="h-4 w-24" />
                </div>
            </div>
            <div className="space-y-4">
                <div>
                    <Skeleton className="h-3 w-16 mb-1" />
                    <Skeleton className="h-4 w-48" />
                </div>
                <div>
                    <Skeleton className="h-3 w-16 mb-1" />
                    <Skeleton className="h-4 w-36" />
                </div>
                <div>
                    <Skeleton className="h-3 w-16 mb-1" />
                    <Skeleton className="h-4 w-28" />
                </div>
            </div>
        </div>
    );
}

/**
 * Loading Spinner
 */
export function Spinner({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
    const sizes = {
        sm: 'w-4 h-4',
        md: 'w-8 h-8',
        lg: 'w-12 h-12',
    };

    return (
        <div className={`${sizes[size]} ${className}`}>
            <svg
                className="animate-spin text-blue-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
            >
                <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                />
                <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
            </svg>
        </div>
    );
}

/**
 * Full Page Loading
 */
export function PageLoading({ message = 'Yükleniyor...' }: { message?: string }) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <Spinner size="lg" className="mx-auto mb-4" />
                <p className="text-gray-500">{message}</p>
            </div>
        </div>
    );
}
