'use client';

/**
 * Admin Dashboard - System Overview
 * Main landing page for admin panel with key metrics and quick actions
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

// ============================================================
// Types
// ============================================================

interface SystemStats {
    tenants: { total: number; active: number };
    users: { total: number; active: number; teachers: number; parents: number };
    students: { total: number; active: number };
    attendance: { today: number; rate: number };
    sessions: { today: number; completed: number };
}

interface RecentActivity {
    id: string;
    type: 'login' | 'checkin' | 'user_created' | 'tenant_created' | 'schedule_updated';
    message: string;
    user?: string;
    timestamp: string;
}

interface SystemHealth {
    database: 'healthy' | 'degraded' | 'down';
    aiService: 'healthy' | 'degraded' | 'down';
    storage: 'healthy' | 'degraded' | 'down';
    mebbis: 'healthy' | 'degraded' | 'down';
}

// ============================================================
// Components
// ============================================================

const StatCard: React.FC<{
    icon: string;
    label: string;
    value: number | string;
    subValue?: string;
    color: string;
    href?: string;
}> = ({ icon, label, value, subValue, color, href }) => {
    const content = (
        <div className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border-l-4 ${color} hover:shadow-md transition-shadow`}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
                    {subValue && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{subValue}</p>
                    )}
                </div>
                <span className="text-3xl">{icon}</span>
            </div>
        </div>
    );

    if (href) {
        return <Link href={href}>{content}</Link>;
    }
    return content;
};

const HealthIndicator: React.FC<{ status: 'healthy' | 'degraded' | 'down' }> = ({ status }) => {
    const colors = {
        healthy: 'bg-green-500',
        degraded: 'bg-yellow-500',
        down: 'bg-red-500',
    };
    return (
        <span className={`inline-block w-3 h-3 rounded-full ${colors[status]} animate-pulse`} />
    );
};

const QuickAction: React.FC<{
    icon: string;
    label: string;
    description: string;
    href: string;
    color: string;
}> = ({ icon, label, description, href, color }) => (
    <Link
        href={href}
        className={`block p-4 rounded-xl border-2 border-dashed ${color} hover:border-solid transition-all group`}
    >
        <div className="flex items-center gap-4">
            <span className="text-2xl group-hover:scale-110 transition-transform">{icon}</span>
            <div>
                <p className="font-semibold text-gray-900 dark:text-white">{label}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
            </div>
        </div>
    </Link>
);

// ============================================================
// Main Page
// ============================================================

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<SystemStats | null>(null);
    const [health, setHealth] = useState<SystemHealth | null>(null);
    const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            // Fetch system stats
            const [statsRes, activityRes, healthRes] = await Promise.all([
                fetch('/api/admin/stats').catch(() => null),
                fetch('/api/admin/activity').catch(() => null),
                fetch('/api/admin/health').catch(() => null),
            ]);

            if (statsRes?.ok) {
                const data = await statsRes.json();
                setStats(data);
            } else {
                // Mock data for demo
                setStats({
                    tenants: { total: 3, active: 3 },
                    users: { total: 45, active: 38, teachers: 12, parents: 28 },
                    students: { total: 67, active: 62 },
                    attendance: { today: 54, rate: 87 },
                    sessions: { today: 32, completed: 18 },
                });
            }

            if (activityRes?.ok) {
                const data = await activityRes.json();
                setRecentActivity(data.activity || []);
            } else {
                // Mock activity
                setRecentActivity([
                    { id: '1', type: 'login', message: 'Admin girişi yapıldı', user: 'admin@arkadas.edu.tr', timestamp: new Date().toISOString() },
                    { id: '2', type: 'checkin', message: 'Yüz tanıma ile yoklama alındı', user: 'Ayşe Öğretmen', timestamp: new Date(Date.now() - 300000).toISOString() },
                    { id: '3', type: 'user_created', message: 'Yeni veli hesabı oluşturuldu', timestamp: new Date(Date.now() - 600000).toISOString() },
                    { id: '4', type: 'schedule_updated', message: 'Terapi programı güncellendi', timestamp: new Date(Date.now() - 900000).toISOString() },
                ]);
            }

            if (healthRes?.ok) {
                const data = await healthRes.json();
                setHealth(data);
            } else {
                setHealth({
                    database: 'healthy',
                    aiService: 'healthy',
                    storage: 'healthy',
                    mebbis: 'degraded',
                });
            }
        } catch (error) {
            console.error('Failed to fetch admin data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

        if (diffMinutes < 1) return 'Az önce';
        if (diffMinutes < 60) return `${diffMinutes} dk önce`;
        if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)} saat önce`;
        return date.toLocaleDateString('tr-TR');
    };

    const getActivityIcon = (type: RecentActivity['type']) => {
        switch (type) {
            case 'login': return '🔐';
            case 'checkin': return '📸';
            case 'user_created': return '👤';
            case 'tenant_created': return '🏢';
            case 'schedule_updated': return '📅';
            default: return '📋';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        🛠️ Admin Dashboard
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Sistem durumu ve özet istatistikler
                    </p>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                    Son güncelleme: {new Date().toLocaleTimeString('tr-TR')}
                </div>
            </div>

            {/* System Health */}
            {health && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                    <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">Sistem Durumu</h2>
                    <div className="flex flex-wrap gap-6">
                        <div className="flex items-center gap-2">
                            <HealthIndicator status={health.database} />
                            <span className="text-sm text-gray-700 dark:text-gray-300">PostgreSQL</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <HealthIndicator status={health.aiService} />
                            <span className="text-sm text-gray-700 dark:text-gray-300">AI Servisi</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <HealthIndicator status={health.storage} />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Dosya Depolama</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <HealthIndicator status={health.mebbis} />
                            <span className="text-sm text-gray-700 dark:text-gray-300">MEBBİS</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Stats Grid */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        icon="🏢"
                        label="Kurumlar"
                        value={stats.tenants.total}
                        subValue={`${stats.tenants.active} aktif`}
                        color="border-blue-500"
                        href="/admin/tenants"
                    />
                    <StatCard
                        icon="👥"
                        label="Kullanıcılar"
                        value={stats.users.total}
                        subValue={`${stats.users.teachers} öğretmen, ${stats.users.parents} veli`}
                        color="border-green-500"
                        href="/admin/kullanicilar"
                    />
                    <StatCard
                        icon="🎓"
                        label="Öğrenciler"
                        value={stats.students.total}
                        subValue={`${stats.students.active} aktif`}
                        color="border-purple-500"
                        href="/admin/ogrenciler"
                    />
                    <StatCard
                        icon="📊"
                        label="Bugün Yoklama"
                        value={`%${stats.attendance.rate}`}
                        subValue={`${stats.attendance.today} kayıt`}
                        color="border-amber-500"
                    />
                </div>
            )}

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Quick Actions */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Hızlı İşlemler
                    </h2>
                    <div className="space-y-3">
                        <QuickAction
                            icon="🏢"
                            label="Yeni Kurum Ekle"
                            description="Sisteme yeni bir rehabilitasyon merkezi ekle"
                            href="/admin/tenants"
                            color="border-blue-300 hover:border-blue-500"
                        />
                        <QuickAction
                            icon="👤"
                            label="Kullanıcı Oluştur"
                            description="Öğretmen, veli veya yönetici hesabı oluştur"
                            href="/admin/kullanicilar"
                            color="border-green-300 hover:border-green-500"
                        />
                        <QuickAction
                            icon="📸"
                            label="Yüz Kayıt Yönetimi"
                            description="Öğrenci yüz tanıma verilerini yönet"
                            href="/admin/face-management"
                            color="border-purple-300 hover:border-purple-500"
                        />
                        <QuickAction
                            icon="🔐"
                            label="Rol & İzinler"
                            description="Kullanıcı rollerini ve izinlerini düzenle"
                            href="/admin/roller"
                            color="border-amber-300 hover:border-amber-500"
                        />
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Son Aktiviteler
                        </h2>
                        <Link
                            href="/admin/loglar"
                            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                        >
                            Tümünü Gör →
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {recentActivity.length === 0 ? (
                            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                                Henüz aktivite yok
                            </p>
                        ) : (
                            recentActivity.map((activity) => (
                                <div
                                    key={activity.id}
                                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                >
                                    <span className="text-xl">{getActivityIcon(activity.type)}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-gray-900 dark:text-white">
                                            {activity.message}
                                        </p>
                                        {activity.user && (
                                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                {activity.user}
                                            </p>
                                        )}
                                    </div>
                                    <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                                        {formatTime(activity.timestamp)}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Session Stats */}
            {stats && (
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
                    <h2 className="text-lg font-semibold mb-4">Bugünün Özeti</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div>
                            <p className="text-blue-200 text-sm">Toplam Seans</p>
                            <p className="text-3xl font-bold">{stats.sessions.today}</p>
                        </div>
                        <div>
                            <p className="text-blue-200 text-sm">Tamamlanan</p>
                            <p className="text-3xl font-bold">{stats.sessions.completed}</p>
                        </div>
                        <div>
                            <p className="text-blue-200 text-sm">Yoklama Alınan</p>
                            <p className="text-3xl font-bold">{stats.attendance.today}</p>
                        </div>
                        <div>
                            <p className="text-blue-200 text-sm">Katılım Oranı</p>
                            <p className="text-3xl font-bold">%{stats.attendance.rate}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
