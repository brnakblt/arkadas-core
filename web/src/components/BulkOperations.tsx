'use client';

/**
 * Bulk Operations Component
 * Enables batch updates on students, attendance, and other entities
 */

import React, { useState, useCallback } from 'react';

// ============================================================
// Types
// ============================================================

export interface BulkItem {
    id: string;
    name: string;
    [key: string]: unknown;
}

export interface BulkAction<T = BulkItem> {
    id: string;
    label: string;
    icon: string;
    variant: 'primary' | 'danger' | 'warning' | 'success';
    onExecute: (items: T[]) => Promise<void>;
}

interface BulkOperationsProps<T extends BulkItem> {
    items: T[];
    actions: BulkAction<T>[];
    renderItem: (item: T, isSelected: boolean) => React.ReactNode;
    onSelectionChange?: (selectedIds: string[]) => void;
}

// ============================================================
// Bulk Operations Component
// ============================================================

export function BulkOperations<T extends BulkItem>({
    items,
    actions,
    renderItem,
    onSelectionChange,
}: BulkOperationsProps<T>) {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [result, setResult] = useState<{ success: number; failed: number } | null>(null);

    const selectedItems = items.filter((item) => selectedIds.has(item.id));

    const toggleItem = useCallback((id: string) => {
        setSelectedIds((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            onSelectionChange?.(Array.from(newSet));
            return newSet;
        });
    }, [onSelectionChange]);

    const selectAll = useCallback(() => {
        const allIds = new Set(items.map((item) => item.id));
        setSelectedIds(allIds);
        onSelectionChange?.(Array.from(allIds));
    }, [items, onSelectionChange]);

    const deselectAll = useCallback(() => {
        setSelectedIds(new Set());
        onSelectionChange?.([]);
    }, [onSelectionChange]);

    const executeAction = useCallback(async (action: BulkAction<T>) => {
        if (selectedItems.length === 0) return;

        setIsProcessing(true);
        setProgress({ current: 0, total: selectedItems.length });
        setResult(null);

        let success = 0;
        let failed = 0;

        try {
            // Process in batches for better UX
            const batchSize = 10;
            for (let i = 0; i < selectedItems.length; i += batchSize) {
                const batch = selectedItems.slice(i, i + batchSize);
                try {
                    await action.onExecute(batch);
                    success += batch.length;
                } catch {
                    failed += batch.length;
                }
                setProgress({ current: Math.min(i + batchSize, selectedItems.length), total: selectedItems.length });
            }
        } finally {
            setIsProcessing(false);
            setResult({ success, failed });
            if (success > 0) {
                deselectAll();
            }
        }
    }, [selectedItems, deselectAll]);

    const getActionStyles = (variant: BulkAction['variant']) => {
        switch (variant) {
            case 'danger':
                return 'bg-red-600 hover:bg-red-700 text-white';
            case 'warning':
                return 'bg-yellow-500 hover:bg-yellow-600 text-white';
            case 'success':
                return 'bg-green-600 hover:bg-green-700 text-white';
            default:
                return 'bg-blue-600 hover:bg-blue-700 text-white';
        }
    };

    return (
        <div className="bulk-operations">
            {/* Selection Bar */}
            <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-4">
                    <input
                        type="checkbox"
                        checked={selectedIds.size === items.length && items.length > 0}
                        onChange={selectedIds.size === items.length ? deselectAll : selectAll}
                        className="w-5 h-5 rounded"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                        {selectedIds.size} / {items.length} seçili
                    </span>
                    {selectedIds.size > 0 && (
                        <button
                            onClick={deselectAll}
                            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                        >
                            Seçimi Temizle
                        </button>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                    {actions.map((action) => (
                        <button
                            key={action.id}
                            onClick={() => executeAction(action)}
                            disabled={selectedIds.size === 0 || isProcessing}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${getActionStyles(action.variant)}`}
                        >
                            <span className="mr-1">{action.icon}</span>
                            {action.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Progress Bar */}
            {isProcessing && (
                <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                        <span>İşleniyor...</span>
                        <span>{progress.current} / {progress.total}</span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-blue-600 transition-all duration-300"
                            style={{ width: `${(progress.current / progress.total) * 100}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Result Message */}
            {result && (
                <div
                    className={`p-4 rounded-lg mb-4 ${result.failed === 0
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                            : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200'
                        }`}
                >
                    ✅ {result.success} başarılı
                    {result.failed > 0 && <span className="ml-2">❌ {result.failed} başarısız</span>}
                </div>
            )}

            {/* Items List */}
            <div className="space-y-2">
                {items.map((item) => (
                    <div
                        key={item.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${selectedIds.has(item.id)
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                            }`}
                        onClick={() => toggleItem(item.id)}
                    >
                        <input
                            type="checkbox"
                            checked={selectedIds.has(item.id)}
                            onChange={() => { }}
                            className="w-4 h-4 rounded"
                        />
                        <div className="flex-1">{renderItem(item, selectedIds.has(item.id))}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ============================================================
// Hook for Bulk Operations
// ============================================================

export function useBulkOperations<T extends BulkItem>(items: T[]) {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const selectedItems = items.filter((item) => selectedIds.has(item.id));

    const toggleItem = (id: string) => {
        setSelectedIds((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const selectAll = () => {
        setSelectedIds(new Set(items.map((item) => item.id)));
    };

    const deselectAll = () => {
        setSelectedIds(new Set());
    };

    const isSelected = (id: string) => selectedIds.has(id);

    return {
        selectedIds: Array.from(selectedIds),
        selectedItems,
        selectedCount: selectedIds.size,
        toggleItem,
        selectAll,
        deselectAll,
        isSelected,
        hasSelection: selectedIds.size > 0,
        isAllSelected: selectedIds.size === items.length && items.length > 0,
    };
}

export default BulkOperations;
