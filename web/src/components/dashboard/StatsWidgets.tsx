'use client';

/**
 * Dashboard Stats Widgets
 * 
 * Displays tenant-specific statistics in a modern card grid layout
 */

import React, { useState, useEffect } from 'react';

interface TenantStats {
    studentsCount: number;
    usersCount: number;
    appointmentsThisWeek: number;
    invoicesThisMonth: number;
    reportsCount: number;
    pendingBep: number;
}

interface StatCardProps {
    title: string;
    value: number;
    icon: string;
    color: string;
    bgColor: string;
    trend?: { value: number; isUp: boolean };
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, bgColor }) => (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{title}</p>
                <p className="text-3xl font-bold mt-1" style={{ color }}>
                    {value.toLocaleString('tr-TR')}
                </p>
            </div>
            <div
                className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
                style={{ backgroundColor: bgColor }}
            >
                {icon}
            </div>
        </div>
    </div>
);

export default function DashboardStatsWidgets() {
    const [stats, setStats] = useState<TenantStats | null>(null);
    const [tenantName, setTenantName] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchStats() {
            try {
                const response = await fetch('/api/dashboard/stats');
                if (!response.ok) {
                    throw new Error('Stats yüklenemedi');
                }
                const data = await response.json();
                setStats(data.stats);
                setTenantName(data.tenantName || '');
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Bir hata oluştu');
            } finally {
                setLoading(false);
            }
        }

        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="mb-8">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-5 animate-pulse">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
                            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error || !stats) {
        return null; // Silent fail - don't break dashboard
    }

    const statCards = [
        {
            title: 'Öğrenci',
            value: stats.studentsCount,
            icon: '👨‍🎓',
            color: '#689F38',
            bgColor: '#F1F8E9',
        },
        {
            title: 'Kullanıcı',
            value: stats.usersCount,
            icon: '👥',
            color: '#E67E22',
            bgColor: '#FFF3E0',
        },
        {
            title: 'Bu Hafta Randevu',
            value: stats.appointmentsThisWeek,
            icon: '📅',
            color: '#4B830D',
            bgColor: '#DCEDC8',
        },
        {
            title: 'Bu Ay Fatura',
            value: stats.invoicesThisMonth,
            icon: '💰',
            color: '#F4A261',
            bgColor: '#FFE0B2',
        },
        {
            title: 'Rapor',
            value: stats.reportsCount,
            icon: '📊',
            color: '#A5D6A7',
            bgColor: '#E8F5E9',
        },
        {
            title: 'Bekleyen BEP',
            value: stats.pendingBep,
            icon: '📋',
            color: '#D32F2F',
            bgColor: '#FFEBEE',
        },
    ];

    return (
        <div className="mb-8">
            {tenantName && (
                <div className="mb-4 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                        {tenantName} İstatistikleri
                    </span>
                </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {statCards.map((card) => (
                    <StatCard key={card.title} {...card} />
                ))}
            </div>
        </div>
    );
}
