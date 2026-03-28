'use client';

/**
 * Real-time Attendance Widget
 * 
 * Dashboard widget showing live attendance statistics with auto-refresh.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Spinner, ProgressBar } from '@/components/ui/Loading';

// ============================================================
// Types
// ============================================================

interface AttendanceStats {
    totalStudents: number;
    present: number;
    absent: number;
    late: number;
    notYetRecorded: number;
    lastUpdated: Date;
}

interface RecentCheckIn {
    id: string;
    studentName: string;
    time: string;
    status: 'present' | 'late';
    photo?: string;
}

interface AttendanceWidgetProps {
    className?: string;
    refreshInterval?: number; // in seconds
    onStudentClick?: (studentId: string) => void;
}

// ============================================================
// Component
// ============================================================

export function AttendanceWidget({
    className = '',
    refreshInterval = 30,
    onStudentClick,
}: AttendanceWidgetProps) {
    const [stats, setStats] = useState<AttendanceStats | null>(null);
    const [recentCheckIns, setRecentCheckIns] = useState<RecentCheckIn[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAttendance = useCallback(async () => {
        try {
            const mockStats: AttendanceStats = {
                totalStudents: 45,
                present: Math.floor(Math.random() * 10) + 30,
                absent: Math.floor(Math.random() * 5) + 2,
                late: Math.floor(Math.random() * 5),
                notYetRecorded: 0,
                lastUpdated: new Date(),
            };
            mockStats.notYetRecorded =
                mockStats.totalStudents - mockStats.present - mockStats.absent - mockStats.late;

            const mockCheckIns: RecentCheckIn[] = [
                { id: '1', studentName: 'Ahmet Yılmaz', time: '08:45', status: 'present' },
                { id: '2', studentName: 'Ayşe Demir', time: '08:47', status: 'present' },
                { id: '3', studentName: 'Mehmet Kaya', time: '09:05', status: 'late' },
                { id: '4', studentName: 'Zeynep Öz', time: '08:50', status: 'present' },
                { id: '5', studentName: 'Can Şahin', time: '08:52', status: 'present' },
            ];

            setStats(mockStats);
            setRecentCheckIns(mockCheckIns);
            setError(null);
        } catch (err) {
            setError('Yoklama verileri yüklenemedi');
            console.error('Attendance fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAttendance();
        const interval = setInterval(fetchAttendance, refreshInterval * 1000);
        return () => clearInterval(interval);
    }, [fetchAttendance, refreshInterval]);

    if (loading) {
        return (
            <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 ${className}`}>
                <div className="flex items-center justify-center h-48">
                    <Spinner size="lg" />
                </div>
            </div>
        );
    }

    if (error || !stats) {
        return (
            <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 ${className}`}>
                <div className="text-center text-red-500 py-8">
                    <p>{error || 'Veri yüklenemedi'}</p>
                    <button
                        onClick={fetchAttendance}
                        className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium shadow-sm"
                    >
                        Tekrar Dene
                    </button>
                </div>
            </div>
        );
    }

    const attendanceRate = Math.round((stats.present / stats.totalStudents) * 100);

    return (
        <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden ${className}`}>
            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-primary-dark px-6 py-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-white font-semibold text-lg">📋 Günlük Yoklama</h3>
                    <span className="text-primary-light text-sm font-medium opacity-90">
                        Son güncelleme: {stats.lastUpdated.toLocaleTimeString('tr-TR')}
                    </span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <StatCard
                        label="Toplam"
                        value={stats.totalStudents}
                        color="gray"
                        icon="👥"
                    />
                    <StatCard
                        label="Gelen"
                        value={stats.present}
                        color="green"
                        icon="✅"
                    />
                    <StatCard
                        label="Gelmeyen"
                        value={stats.absent}
                        color="red"
                        icon="❌"
                    />
                    <StatCard
                        label="Geç Kalan"
                        value={stats.late}
                        color="orange"
                        icon="⏰"
                    />
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                            Katılım Oranı
                        </span>
                        <span className="text-sm font-bold text-primary">%{attendanceRate}</span>
                    </div>
                    <ProgressBar
                        progress={attendanceRate}
                        color={attendanceRate >= 90 ? 'success' : attendanceRate >= 70 ? 'warning' : 'error'}
                        size="lg"
                    />
                </div>

                {/* Recent Check-ins */}
                <div>
                    <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 mb-3 uppercase tracking-widest">
                        Son Girişler
                    </h4>
                    <div className="space-y-2">
                        {recentCheckIns.slice(0, 5).map((checkIn) => (
                            <div
                                key={checkIn.id}
                                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors group"
                                onClick={() => onStudentClick?.(checkIn.id)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center text-xs text-primary font-bold">
                                        {checkIn.studentName.charAt(0)}
                                    </div>
                                    <span className="font-semibold text-gray-800 dark:text-gray-200 group-hover:text-primary transition-colors text-sm">
                                        {checkIn.studentName}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                        {checkIn.time}
                                    </span>
                                    <span
                                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${checkIn.status === 'present'
                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400'
                                            : 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400'
                                            }`}
                                    >
                                        {checkIn.status === 'present' ? 'Geldi' : 'Geç'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                {stats.notYetRecorded > 0 && (
                    <div className="mt-4 p-3 bg-secondary/5 dark:bg-secondary/10 rounded-lg border border-secondary/10">
                        <p className="text-xs text-secondary-dark dark:text-secondary-light font-bold text-center uppercase tracking-wide">
                            ⚠️ {stats.notYetRecorded} öğrencinin yoklaması henüz alınmadı
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

// ============================================================
// Sub-components
// ============================================================

interface StatCardProps {
    label: string;
    value: number;
    color: 'gray' | 'green' | 'red' | 'orange';
    icon: string;
}

function StatCard({ label, value, color, icon }: StatCardProps) {
    const colorClasses = {
        gray: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
        green: 'bg-primary/10 dark:bg-primary/20 text-primary-dark dark:text-primary-light',
        red: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400',
        orange: 'bg-secondary/10 dark:bg-secondary/20 text-secondary-dark dark:text-secondary-light',
    };

    return (
        <div className={`p-4 rounded-xl border border-transparent hover:border-gray-200 dark:hover:border-gray-600 transition-all ${colorClasses[color]}`}>
            <div className="text-xl mb-1">{icon}</div>
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-[10px] uppercase font-bold tracking-wider opacity-70">{label}</div>
        </div>
    );
}

export default AttendanceWidget;
