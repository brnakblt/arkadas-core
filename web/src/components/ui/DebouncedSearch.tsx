'use client';

import { useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';

interface DebouncedSearchProps {
    value: string;
    onChange: (value: string) => void;
    delay?: number;
    placeholder?: string;
    className?: string;
}

/**
 * Search Input Component with debouncing
 */
export function DebouncedSearch({
    value,
    onChange,
    delay = 300,
    placeholder = 'Ara...',
    className = '',
}: DebouncedSearchProps) {
    const [localValue, setLocalValue] = useState(value);
    const debouncedValue = useDebounce(localValue, delay);

    // Sync with external value
    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    // Call onChange when debounced value changes
    useEffect(() => {
        if (debouncedValue !== value) {
            onChange(debouncedValue);
        }
    }, [debouncedValue, onChange, value]);

    return (
        <div className={`relative ${className}`}>
            <input
                type="text"
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
                placeholder={placeholder}
                data-search
                className="w-full pl-10 pr-10 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                🔍
            </span>
            {localValue && (
                <button
                    onClick={() => {
                        setLocalValue('');
                        onChange('');
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-lg"
                    aria-label="Aramayı temizle"
                >
                    ✕
                </button>
            )}
        </div>
    );
}

/**
 * Search with Filter Dropdown
 */
export function SearchWithFilters({
    value,
    onChange,
    filters,
    activeFilter,
    onFilterChange,
    placeholder = 'Ara...',
    className = '',
}: {
    value: string;
    onChange: (value: string) => void;
    filters: { value: string; label: string }[];
    activeFilter: string;
    onFilterChange: (filter: string) => void;
    placeholder?: string;
    className?: string;
}) {
    return (
        <div className={`flex gap-2 ${className}`}>
            <DebouncedSearch
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="flex-1"
            />
            <select
                value={activeFilter}
                onChange={(e) => onFilterChange(e.target.value)}
                className="px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                {filters.map((filter) => (
                    <option key={filter.value} value={filter.value}>
                        {filter.label}
                    </option>
                ))}
            </select>
        </div>
    );
}
