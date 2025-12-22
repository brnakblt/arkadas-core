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

    // Fetch attendance data
    const fetchAttendance = useCallback(async () => {
        try {
            // In production, replace with actual API call
            // const response = await fetch('/api/attendance/today');
            // const data = await response.json();

            // Mock data for demonstration
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

        // Auto-refresh
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
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-white font-semibold text-lg">📋 Günlük Yoklama</h3>
                    <span className="text-blue-100 text-sm">
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
                        color="yellow"
                        icon="⏰"
                    />
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Katılım Oranı
                        </span>
                        <span className="text-sm font-bold text-blue-600">%{attendanceRate}</span>
                    </div>
                    <ProgressBar
                        progress={attendanceRate}
                        color={attendanceRate >= 90 ? 'success' : attendanceRate >= 70 ? 'warning' : 'error'}
                        size="lg"
                    />
                </div>

                {/* Recent Check-ins */}
                <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Son Girişler
                    </h4>
                    <div className="space-y-2">
                        {recentCheckIns.slice(0, 5).map((checkIn) => (
                            <div
                                key={checkIn.id}
                                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                                onClick={() => onStudentClick?.(checkIn.id)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-sm">
                                        {checkIn.studentName.charAt(0)}
                                    </div>
                                    <span className="font-medium text-gray-800 dark:text-gray-200">
                                        {checkIn.studentName}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                        {checkIn.time}
                                    </span>
                                    <span
                                        className={`text-xs px-2 py-1 rounded-full ${checkIn.status === 'present'
                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400'
                                            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400'
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
                    <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                        <p className="text-sm text-amber-700 dark:text-amber-400">
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
    color: 'gray' | 'green' | 'red' | 'yellow' | 'blue';
    icon: string;
}

function StatCard({ label, value, color, icon }: StatCardProps) {
    const colorClasses = {
        gray: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
        green: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400',
        red: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400',
        yellow: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400',
        blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400',
    };

    return (
        <div className={`p-4 rounded-lg ${colorClasses[color]}`}>
            <div className="text-2xl mb-1">{icon}</div>
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-sm opacity-80">{label}</div>
        </div>
    );
}

export default AttendanceWidget;
