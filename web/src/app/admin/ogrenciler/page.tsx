'use client';

/**
 * Bulk Students Management Page
 * Uses BulkOperations component for batch student updates
 */

import React, { useState, useEffect } from 'react';
import { BulkOperations, BulkAction, BulkItem } from '@/components/BulkOperations';

// ============================================================
// Types
// ============================================================

interface Student extends BulkItem {
    id: string;
    name: string;
    class: string;
    status: 'active' | 'inactive' | 'graduated';
    parentPhone: string;
}

// ============================================================
// Mock Data
// ============================================================

const mockStudents: Student[] = [
    { id: '1', name: 'Ahmet Yılmaz', class: '1-A', status: 'active', parentPhone: '532 111 2233' },
    { id: '2', name: 'Ayşe Demir', class: '1-A', status: 'active', parentPhone: '533 222 3344' },
    { id: '3', name: 'Mehmet Kaya', class: '2-B', status: 'active', parentPhone: '534 333 4455' },
    { id: '4', name: 'Fatma Şahin', class: '2-B', status: 'inactive', parentPhone: '535 444 5566' },
    { id: '5', name: 'Ali Öztürk', class: '3-A', status: 'active', parentPhone: '536 555 6677' },
    { id: '6', name: 'Zeynep Arslan', class: '3-A', status: 'graduated', parentPhone: '537 666 7788' },
    { id: '7', name: 'Emre Yıldız', class: '1-B', status: 'active', parentPhone: '538 777 8899' },
    { id: '8', name: 'Selin Çelik', class: '1-B', status: 'active', parentPhone: '539 888 9900' },
];

// ============================================================
// Page Component
// ============================================================

export default function BulkStudentsPage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'active' | 'inactive' | 'graduated'>('all');

    useEffect(() => {
        loadStudents();
    }, []);

    const loadStudents = async () => {
        setLoading(true);
        await new Promise((r) => setTimeout(r, 500));
        setStudents(mockStudents);
        setLoading(false);
    };

    const filteredStudents = students.filter((s) => {
        if (filter === 'all') return true;
        return s.status === filter;
    });

    const bulkActions: BulkAction<Student>[] = [
        {
            id: 'activate',
            label: 'Aktif Yap',
            icon: '✅',
            variant: 'success',
            onExecute: async (items) => {
                await new Promise((r) => setTimeout(r, 500));
                setStudents((prev) =>
                    prev.map((s) =>
                        items.some((i) => i.id === s.id) ? { ...s, status: 'active' } : s
                    )
                );
            },
        },
        {
            id: 'deactivate',
            label: 'Pasif Yap',
            icon: '⏸️',
            variant: 'warning',
            onExecute: async (items) => {
                await new Promise((r) => setTimeout(r, 500));
                setStudents((prev) =>
                    prev.map((s) =>
                        items.some((i) => i.id === s.id) ? { ...s, status: 'inactive' } : s
                    )
                );
            },
        },
        {
            id: 'notify',
            label: 'SMS Gönder',
            icon: '📱',
            variant: 'primary',
            onExecute: async (_items) => {
                await new Promise((r) => setTimeout(r, 1000));
                // console.log('SMS sent to:', items.map((i) => i.parentPhone));
            },
        },
        {
            id: 'delete',
            label: 'Sil',
            icon: '🗑️',
            variant: 'danger',
            onExecute: async (items) => {
                await new Promise((r) => setTimeout(r, 500));
                setStudents((prev) => prev.filter((s) => !items.some((i) => i.id === s.id)));
            },
        },
    ];

    const renderStudent = (student: Student) => (
        <div className="flex items-center justify-between w-full">
            <div>
                <span className="font-medium text-gray-900 dark:text-white">{student.name}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">({student.class})</span>
            </div>
            <span
                className={`px-2 py-1 rounded-full text-xs ${student.status === 'active'
                    ? 'bg-green-100 text-green-700'
                    : student.status === 'inactive'
                        ? 'bg-gray-100 text-gray-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
            >
                {student.status === 'active' ? 'Aktif' : student.status === 'inactive' ? 'Pasif' : 'Mezun'}
            </span>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <header className="bg-white dark:bg-gray-800 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        👥 Toplu Öğrenci İşlemleri
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Birden fazla öğrenciyi seçerek toplu işlem yapın
                    </p>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Filter Tabs */}
                <div className="flex gap-2 mb-6">
                    {(['all', 'active', 'inactive', 'graduated'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f
                                ? 'bg-blue-600 text-white'
                                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                        >
                            {f === 'all' ? 'Tümü' : f === 'active' ? 'Aktif' : f === 'inactive' ? 'Pasif' : 'Mezun'}
                            <span className="ml-1 opacity-70">
                                ({students.filter((s) => f === 'all' || s.status === f).length})
                            </span>
                        </button>
                    ))}
                </div>

                {/* Bulk Operations */}
                {loading ? (
                    <div className="text-center py-12 text-gray-500">Yükleniyor...</div>
                ) : (
                    <BulkOperations<Student>
                        items={filteredStudents}
                        actions={bulkActions}
                        renderItem={renderStudent}
                    />
                )}
            </main>
        </div>
    );
}
