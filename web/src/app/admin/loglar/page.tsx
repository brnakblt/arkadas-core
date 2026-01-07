'use client';

/**
 * Admin Logs Page
 * System activity and audit logs viewer
 */

import React, { useState } from 'react';

// ============================================================
// Types
// ============================================================

interface LogEntry {
    id: string;
    timestamp: string;
    level: 'info' | 'warning' | 'error' | 'success';
    action: string;
    user: string;
    details: string;
    ip?: string;
}

// ============================================================
// Mock Data
// ============================================================

const mockLogs: LogEntry[] = [
    {
        id: '1',
        timestamp: '2025-12-13T17:45:00',
        level: 'success',
        action: 'Giriş yapıldı',
        user: 'admin@arkadas.com',
        details: 'Başarılı oturum açma',
        ip: '192.168.1.100',
    },
    {
        id: '2',
        timestamp: '2025-12-13T17:30:00',
        level: 'info',
        action: 'Öğrenci güncellendi',
        user: 'teacher@arkadas.com',
        details: 'Ahmet Yılmaz bilgileri güncellendi',
    },
    {
        id: '3',
        timestamp: '2025-12-13T17:15:00',
        level: 'warning',
        action: 'Başarısız giriş',
        user: 'unknown@test.com',
        details: '3 başarısız giriş denemesi',
        ip: '85.107.45.23',
    },
    {
        id: '4',
        timestamp: '2025-12-13T16:50:00',
        level: 'error',
        action: 'API hatası',
        user: 'system',
        details: 'MEBBIS bağlantı zaman aşımı',
    },
    {
        id: '5',
        timestamp: '2025-12-13T16:30:00',
        level: 'success',
        action: 'Yoklama kaydedildi',
        user: 'driver@arkadas.com',
        details: '12 öğrenci için yoklama alındı',
    },
    {
        id: '6',
        timestamp: '2025-12-13T16:00:00',
        level: 'info',
        action: 'Rapor oluşturuldu',
        user: 'admin@arkadas.com',
        details: 'Aylık yoklama raporu dışa aktarıldı',
    },
];

// ============================================================
// Page Component
// ============================================================

export default function LogsPage() {
    const [logs] = useState<LogEntry[]>(mockLogs);
    const [filter, setFilter] = useState<'all' | 'info' | 'warning' | 'error' | 'success'>('all');
    const [search, setSearch] = useState('');

    const filteredLogs = logs.filter((log) => {
        if (filter !== 'all' && log.level !== filter) return false;
        if (search) {
            const searchLower = search.toLowerCase();
            return (
                log.action.toLowerCase().includes(searchLower) ||
                log.user.toLowerCase().includes(searchLower) ||
                log.details.toLowerCase().includes(searchLower)
            );
        }
        return true;
    });

    const getLevelStyles = (level: LogEntry['level']) => {
        switch (level) {
            case 'success':
                return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
            case 'warning':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'error':
                return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
            default:
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
        }
    };

    const getLevelIcon = (level: LogEntry['level']) => {
        switch (level) {
            case 'success':
                return '✅';
            case 'warning':
                return '⚠️';
            case 'error':
                return '❌';
            default:
                return 'ℹ️';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <header className="bg-white dark:bg-gray-800 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                📋 Sistem Logları
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400 mt-1">
                                Aktivite ve denetim kayıtları
                            </p>
                        </div>
                        <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm">
                            📥 Logları Dışa Aktar
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Filters */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="Ara... (kullanıcı, işlem, detay)"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                        </div>
                        {/* Level Filter */}
                        <div className="flex gap-2">
                            {(['all', 'info', 'warning', 'error', 'success'] as const).map((level) => (
                                <button
                                    key={level}
                                    onClick={() => setFilter(level)}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filter === level
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                        }`}
                                >
                                    {level === 'all' ? 'Tümü' : level.charAt(0).toUpperCase() + level.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Log Entries */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {filteredLogs.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                                Gösterilecek log kaydı bulunamadı
                            </div>
                        ) : (
                            filteredLogs.map((log) => (
                                <div
                                    key={log.id}
                                    className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                >
                                    <div className="flex items-start gap-4">
                                        {/* Icon */}
                                        <div className="text-2xl">{getLevelIcon(log.level)}</div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-medium text-gray-900 dark:text-white">
                                                    {log.action}
                                                </span>
                                                <span
                                                    className={`px-2 py-0.5 rounded text-xs font-medium ${getLevelStyles(
                                                        log.level
                                                    )}`}
                                                >
                                                    {log.level}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                {log.details}
                                            </p>
                                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                                                <span>👤 {log.user}</span>
                                                {log.ip && <span>🌐 {log.ip}</span>}
                                                <span>
                                                    🕐{' '}
                                                    {new Date(log.timestamp).toLocaleString('tr-TR', {
                                                        dateStyle: 'short',
                                                        timeStyle: 'short',
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
