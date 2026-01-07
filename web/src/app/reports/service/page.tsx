'use client';

// Skip prerendering for static export
export const dynamic = 'force-static';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { authFetch } from '@/lib/auth';
import { BarChart, PieChart, StatCard } from '@/components/charts/DashboardCharts';
import { exportToPDF, exportToExcel } from '@/lib/reportExport';

// ============================================================
// Types
// ============================================================

interface ServiceRoute {
    id: number;
    attributes: {
        name: string;
        driver: string;
        vehicle: string;
        isActive: boolean;
        students: {
            data: { id: number }[];
        };
    };
}

interface ServiceLog {
    id: number;
    attributes: {
        date: string;
        routeId: number;
        startTime: string;
        endTime: string;
        distanceKm: number;
        status: 'completed' | 'cancelled' | 'delayed';
        delayMinutes?: number;
    };
}

// ============================================================
// Data Fetching
// ============================================================

async function fetchServiceRoutes() {
    const response = await authFetch<{ data: ServiceRoute[] }>(
        '/api/service-routes?populate=students&pagination[pageSize]=50'
    );
    return response.data;
}

async function fetchServiceLogs(year: number, month: number) {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    const response = await authFetch<{ data: ServiceLog[] }>(
        `/api/service-logs?filters[date][$gte]=${startDate}&filters[date][$lte]=${endDate}&pagination[pageSize]=500`
    );
    return response.data;
}

// ============================================================
// Component
// ============================================================

export default function ServiceStatsReport() {
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

    const { data: routes = [], isLoading: loadingRoutes } = useQuery({
        queryKey: ['service-routes'],
        queryFn: fetchServiceRoutes,
    });

    const { data: logs = [], isLoading: loadingLogs } = useQuery({
        queryKey: ['service-logs', selectedYear, selectedMonth],
        queryFn: () => fetchServiceLogs(selectedYear, selectedMonth),
    });

    const isLoading = loadingRoutes || loadingLogs;

    // Calculate statistics
    const stats = useMemo(() => {
        const completed = logs.filter(l => l.attributes.status === 'completed').length;
        const cancelled = logs.filter(l => l.attributes.status === 'cancelled').length;
        const delayed = logs.filter(l => l.attributes.status === 'delayed').length;
        const totalKm = logs.reduce((sum, l) => sum + (l.attributes.distanceKm || 0), 0);
        const avgDelay = delayed > 0
            ? logs.filter(l => l.attributes.delayMinutes)
                .reduce((sum, l) => sum + (l.attributes.delayMinutes || 0), 0) / delayed
            : 0;

        return {
            total: logs.length,
            completed,
            cancelled,
            delayed,
            onTimeRate: logs.length > 0 ? Math.round((completed / logs.length) * 100) : 0,
            totalKm: Math.round(totalKm),
            avgDelay: Math.round(avgDelay),
            activeRoutes: routes.filter(r => r.attributes.isActive).length,
            totalStudents: routes.reduce((sum, r) => sum + (r.attributes.students?.data?.length || 0), 0),
        };
    }, [logs, routes]);

    // Daily trip counts
    const dailyData = useMemo(() => {
        const days: Record<string, number> = {};

        logs.forEach(log => {
            const day = log.attributes.date;
            days[day] = (days[day] || 0) + 1;
        });

        return Object.entries(days)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, count]) => ({
                label: new Date(date).getDate().toString(),
                value: count,
                color: '#3b82f6',
            }));
    }, [logs]);

    // Route performance
    const routePerformance = useMemo(() => {
        return routes.map(route => {
            const routeLogs = logs.filter(l => l.attributes.routeId === route.id);
            const completed = routeLogs.filter(l => l.attributes.status === 'completed').length;
            const total = routeLogs.length;

            return {
                name: route.attributes.name,
                driver: route.attributes.driver,
                vehicle: route.attributes.vehicle,
                trips: total,
                completed,
                rate: total > 0 ? Math.round((completed / total) * 100) : 0,
                students: route.attributes.students?.data?.length || 0,
            };
        });
    }, [routes, logs]);

    // Status breakdown for pie chart
    const statusData = [
        { label: 'Tamamlandı', value: stats.completed, color: '#10b981' },
        { label: 'İptal', value: stats.cancelled, color: '#ef4444' },
        { label: 'Gecikmeli', value: stats.delayed, color: '#f59e0b' },
    ];

    const monthNames = [
        'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
        'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];

    // Export handlers
    const handleExportPDF = () => {
        const tableHtml = `
            <table><thead><tr><th>Güzergah</th><th>Sürücü</th><th>Sefer</th><th>Başarı</th><th>Öğrenci</th></tr></thead>
            <tbody>${routePerformance.map(r => `<tr><td>${r.name}</td><td>${r.driver}</td><td>${r.trips}</td><td>%${r.rate}</td><td>${r.students}</td></tr>`).join('')}</tbody></table>
            <p>Toplam: ${stats.total} | Zamanında: %${stats.onTimeRate} | Mesafe: ${stats.totalKm} km</p>
        `;
        exportToPDF({
            title: `Servis Kullanım İstatistikleri`,
            subtitle: `${monthNames[selectedMonth - 1]} ${selectedYear}`,
            date: new Date().toLocaleDateString('tr-TR'),
            content: tableHtml,
        });
    };

    const handleExportExcel = () => {
        exportToExcel({
            filename: `servis-stats-${selectedYear}-${selectedMonth}`,
            columns: [
                { header: 'Güzergah', key: 'name' },
                { header: 'Sürücü', key: 'driver' },
                { header: 'Araç', key: 'vehicle' },
                { header: 'Sefer', key: 'trips' },
                { header: 'Başarı', key: 'rate' },
                { header: 'Öğrenci', key: 'students' },
            ],
            data: routePerformance.map(r => ({ name: r.name, driver: r.driver, vehicle: r.vehicle, trips: r.trips, rate: `%${r.rate}`, students: r.students })),
        });
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Servis Kullanım İstatistikleri
                </h1>

                <div className="flex items-center gap-4">
                    <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(Number(e.target.value))}
                        className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
                    >
                        {monthNames.map((name, i) => (
                            <option key={i} value={i + 1}>{name}</option>
                        ))}
                    </select>

                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
                    >
                        {[2023, 2024, 2025].map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>

                    <button
                        onClick={handleExportPDF}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                        PDF
                    </button>
                    <button
                        onClick={handleExportExcel}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                        Excel
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
                </div>
            ) : (
                <>
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <StatCard
                            title="Toplam Sefer"
                            value={stats.total}
                            change={stats.activeRoutes}
                            color="blue"
                        />
                        <StatCard
                            title="Zamanında"
                            value={`%${stats.onTimeRate}`}
                            change={stats.completed}
                            color="green"
                        />
                        <StatCard
                            title="Gecikmeli"
                            value={stats.delayed}
                            change={stats.avgDelay}
                            color="yellow"
                        />
                        <StatCard
                            title="Toplam Mesafe"
                            value={`${stats.totalKm}`}
                            change={0}
                            color="purple"
                        />
                        <StatCard
                            title="Taşınan Öğrenci"
                            value={stats.totalStudents}
                            change={routes.length}
                            color="red"
                        />
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
                            <h2 className="text-lg font-semibold mb-4">Günlük Sefer Sayısı</h2>
                            <BarChart data={dailyData} height={250} />
                        </div>

                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
                            <h2 className="text-lg font-semibold mb-4">Sefer Durumu Dağılımı</h2>
                            <PieChart data={statusData} size={200} />
                        </div>
                    </div>

                    {/* Route Performance Table */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
                        <div className="p-4 border-b dark:border-gray-600">
                            <h2 className="text-lg font-semibold">Güzergah Performansı</h2>
                        </div>
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Güzergah
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Sürücü
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Araç
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                        Sefer
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                        Başarı
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                        Öğrenci
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                                {routePerformance.map((route, i) => (
                                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <td className="px-6 py-4 font-medium">{route.name}</td>
                                        <td className="px-6 py-4">{route.driver}</td>
                                        <td className="px-6 py-4 text-gray-500">{route.vehicle}</td>
                                        <td className="px-6 py-4 text-center">{route.trips}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2 py-1 rounded-full text-sm ${route.rate >= 95
                                                ? 'bg-green-100 text-green-800'
                                                : route.rate >= 80
                                                    ? 'bg-yellow-100 text-yellow-800'
                                                    : 'bg-red-100 text-red-800'
                                                }`}>
                                                %{route.rate}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">{route.students}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
}
