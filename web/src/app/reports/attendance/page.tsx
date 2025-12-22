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

interface AttendanceRecord {
    id: number;
    attributes: {
        date: string;
        status: 'present' | 'absent' | 'late' | 'excused';
        checkInTime?: string;
        checkOutTime?: string;
        student: {
            data: {
                id: number;
                attributes: {
                    firstName: string;
                    lastName: string;
                };
            };
        };
    };
}

interface AttendanceStats {
    present: number;
    absent: number;
    late: number;
    excused: number;
    total: number;
}

// ============================================================
// Data Fetching
// ============================================================

async function fetchMonthlyAttendance(year: number, month: number) {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    const response = await authFetch<{ data: AttendanceRecord[] }>(
        `/api/attendance-logs?filters[date][$gte]=${startDate}&filters[date][$lte]=${endDate}&populate=student&pagination[pageSize]=1000`
    );

    return response.data;
}

// ============================================================
// Component
// ============================================================

export default function MonthlyAttendanceReport() {
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

    const { data: records = [], isLoading } = useQuery({
        queryKey: ['attendance-report', selectedYear, selectedMonth],
        queryFn: () => fetchMonthlyAttendance(selectedYear, selectedMonth),
    });

    // Calculate statistics
    const stats = useMemo<AttendanceStats>(() => {
        const result = { present: 0, absent: 0, late: 0, excused: 0, total: 0 };

        records.forEach(record => {
            result[record.attributes.status]++;
            result.total++;
        });

        return result;
    }, [records]);

    // Daily breakdown for chart
    const dailyData = useMemo(() => {
        const days: Record<string, AttendanceStats> = {};

        records.forEach(record => {
            const day = record.attributes.date;
            if (!days[day]) {
                days[day] = { present: 0, absent: 0, late: 0, excused: 0, total: 0 };
            }
            days[day][record.attributes.status]++;
            days[day].total++;
        });

        return Object.entries(days)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, data]) => ({
                label: new Date(date).getDate().toString(),
                value: data.present,
                color: '#10b981',
            }));
    }, [records]);

    // Student breakdown
    const studentData = useMemo(() => {
        const students: Record<string, { name: string; present: number; total: number }> = {};

        records.forEach(record => {
            const student = record.attributes.student?.data;
            if (!student) return;

            const id = String(student.id);
            if (!students[id]) {
                students[id] = {
                    name: `${student.attributes.firstName} ${student.attributes.lastName}`,
                    present: 0,
                    total: 0,
                };
            }

            if (record.attributes.status === 'present') {
                students[id].present++;
            }
            students[id].total++;
        });

        return Object.values(students);
    }, [records]);

    // Export handlers
    const handleExportPDF = () => {
        const tableHtml = `
            <table><thead><tr><th>Öğrenci</th><th>Gelen</th><th>Toplam</th><th>Oran</th></tr></thead>
            <tbody>${studentData.map(s => `<tr><td>${s.name}</td><td>${s.present}</td><td>${s.total}</td><td>%${Math.round((s.present / s.total) * 100)}</td></tr>`).join('')}</tbody></table>
            <p>Toplam: ${stats.total} | Mevcut: ${stats.present} | Yok: ${stats.absent}</p>
        `;
        exportToPDF({
            title: `Aylık Yoklama Raporu - ${monthNames[selectedMonth - 1]} ${selectedYear}`,
            subtitle: 'Arkadaş Özel Eğitim',
            date: new Date().toLocaleDateString('tr-TR'),
            content: tableHtml,
        });
    };

    const handleExportExcel = () => {
        exportToExcel({
            filename: `yoklama-${selectedYear}-${selectedMonth}`,
            columns: [
                { header: 'Öğrenci', key: 'student' },
                { header: 'Gelen', key: 'present' },
                { header: 'Toplam', key: 'total' },
                { header: 'Oran', key: 'rate' },
            ],
            data: studentData.map(s => ({ student: s.name, present: s.present, total: s.total, rate: `%${Math.round((s.present / s.total) * 100)}` })),
        });
    };

    const monthNames = [
        'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
        'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];

    const pieData = [
        { label: 'Mevcut', value: stats.present, color: '#10b981' },
        { label: 'Yok', value: stats.absent, color: '#ef4444' },
        { label: 'Geç', value: stats.late, color: '#f59e0b' },
        { label: 'İzinli', value: stats.excused, color: '#6366f1' },
    ];

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Aylık Yoklama Raporu
                </h1>

                <div className="flex items-center gap-4">
                    {/* Month/Year Selector */}
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

                    {/* Export Buttons */}
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
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <StatCard
                            title="Mevcut"
                            value={stats.present}
                            change={Math.round((stats.present / Math.max(stats.total, 1)) * 100)}
                            color="green"
                        />
                        <StatCard
                            title="Yok"
                            value={stats.absent}
                            change={Math.round((stats.absent / Math.max(stats.total, 1)) * 100)}
                            color="red"
                        />
                        <StatCard
                            title="Geç"
                            value={stats.late}
                            change={Math.round((stats.late / Math.max(stats.total, 1)) * 100)}
                            color="yellow"
                        />
                        <StatCard
                            title="Toplam"
                            value={stats.total}
                            change={studentData.length}
                            color="purple"
                        />
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
                            <h2 className="text-lg font-semibold mb-4">Günlük Devam</h2>
                            <BarChart data={dailyData} height={250} />
                        </div>

                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
                            <h2 className="text-lg font-semibold mb-4">Durum Dağılımı</h2>
                            <PieChart data={pieData} size={200} />
                        </div>
                    </div>

                    {/* Student Table */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Öğrenci
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                        Gelen
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                        Toplam
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                        Devam Oranı
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                                {studentData.map((student, i) => (
                                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <td className="px-6 py-4 whitespace-nowrap">{student.name}</td>
                                        <td className="px-6 py-4 text-center text-green-600">{student.present}</td>
                                        <td className="px-6 py-4 text-center">{student.total}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2 py-1 rounded-full text-sm ${(student.present / student.total) >= 0.9
                                                ? 'bg-green-100 text-green-800'
                                                : (student.present / student.total) >= 0.7
                                                    ? 'bg-yellow-100 text-yellow-800'
                                                    : 'bg-red-100 text-red-800'
                                                }`}>
                                                %{Math.round((student.present / student.total) * 100)}
                                            </span>
                                        </td>
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
