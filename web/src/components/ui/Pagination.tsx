'use client';

import { useMemo } from 'react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems?: number;
    pageSize?: number;
    onPageChange: (page: number) => void;
    showInfo?: boolean;
    className?: string;
}

/**
 * Pagination Component
 */
export function Pagination({
    currentPage,
    totalPages,
    totalItems,
    pageSize = 10,
    onPageChange,
    showInfo = true,
    className = '',
}: PaginationProps) {
    const pages = useMemo(() => {
        const items: (number | 'ellipsis')[] = [];
        const showEllipsis = totalPages > 7;

        if (!showEllipsis) {
            // Show all pages
            for (let i = 1; i <= totalPages; i++) {
                items.push(i);
            }
        } else {
            // Always show first page
            items.push(1);

            if (currentPage > 3) {
                items.push('ellipsis');
            }

            // Show pages around current
            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);

            for (let i = start; i <= end; i++) {
                items.push(i);
            }

            if (currentPage < totalPages - 2) {
                items.push('ellipsis');
            }

            // Always show last page
            if (totalPages > 1) {
                items.push(totalPages);
            }
        }

        return items;
    }, [currentPage, totalPages]);

    if (totalPages <= 1) return null;

    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalItems || 0);

    return (
        <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`}>
            {/* Info */}
            {showInfo && totalItems && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-medium">{startItem}</span> - <span className="font-medium">{endItem}</span>
                    {' '}/{' '}
                    <span className="font-medium">{totalItems}</span> kayıt
                </p>
            )}

            {/* Pagination Controls */}
            <nav className="flex items-center gap-1">
                {/* Previous */}
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Önceki sayfa"
                >
                    ←
                </button>

                {/* Page Numbers */}
                {pages.map((page, index) =>
                    page === 'ellipsis' ? (
                        <span key={`ellipsis-${index}`} className="px-2 text-gray-400">
                            ...
                        </span>
                    ) : (
                        <button
                            key={page}
                            onClick={() => onPageChange(page)}
                            className={`min-w-[40px] h-10 rounded-lg font-medium transition-colors ${currentPage === page
                                    ? 'bg-blue-500 text-white'
                                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200'
                                }`}
                            aria-current={currentPage === page ? 'page' : undefined}
                        >
                            {page}
                        </button>
                    )
                )}

                {/* Next */}
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Sonraki sayfa"
                >
                    →
                </button>
            </nav>
        </div>
    );
}

/**
 * Hook for pagination state
 */
export function usePagination<T>(items: T[], pageSize: number = 10) {
    const [currentPage, setCurrentPage] = useState(1);

    const totalPages = Math.ceil(items.length / pageSize);
    const paginatedItems = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return items.slice(start, start + pageSize);
    }, [items, currentPage, pageSize]);

    const goToPage = (page: number) => {
        setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    };

    return {
        currentPage,
        totalPages,
        totalItems: items.length,
        pageSize,
        paginatedItems,
        goToPage,
        goToFirst: () => goToPage(1),
        goToLast: () => goToPage(totalPages),
        goToPrev: () => goToPage(currentPage - 1),
        goToNext: () => goToPage(currentPage + 1),
    };
}

import { useState } from 'react';

/**
 * Page Size Selector
 */
export function PageSizeSelector({
    value,
    onChange,
    options = [10, 25, 50, 100],
    className = '',
}: {
    value: number;
    onChange: (size: number) => void;
    options?: number[];
    className?: string;
}) {
    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <label className="text-sm text-gray-500 dark:text-gray-400">
                Sayfa başına:
            </label>
            <select
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                {options.map((option) => (
                    <option key={option} value={option}>
                        {option}
                    </option>
                ))}
            </select>
        </div>
    );
}
