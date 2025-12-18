'use client';

import { useState, useEffect } from 'react';
import AttendanceStats from '@/components/attendance/AttendanceStats';
import AttendanceTable from '@/components/attendance/AttendanceTable';
import AttendanceFilters from '@/components/attendance/AttendanceFilters';

interface AttendanceRecord {
    id: string;
    studentId: string;
    studentName: string;
    studentPhoto?: string;
    date: string;
    checkInTime?: string;
    checkOutTime?: string;
    status: 'present' | 'absent' | 'late' | 'excused';
    verificationMethod: 'face_recognition' | 'manual' | 'card';
    confidenceScore?: number;
    notes?: string;
}

interface AttendanceStatsData {
    totalStudents: number;
    presentToday: number;
    absentToday: number;
    lateToday: number;
    attendanceRate: number;
    weeklyTrend: number[];
}

// Mock data
const MOCK_STATS: AttendanceStatsData = {
    totalStudents: 48,
    presentToday: 42,
    absentToday: 4,
    lateToday: 2,
    attendanceRate: 87.5,
    weeklyTrend: [85, 88, 90, 87, 92, 88, 87.5],
};

const MOCK_RECORDS: AttendanceRecord[] = [
    { id: '1', studentId: 's1', studentName: 'Ali Yılmaz', date: '2024-12-12', checkInTime: '08:15', checkOutTime: '16:00', status: 'present', verificationMethod: 'face_recognition', confidenceScore: 0.95 },
    { id: '2', studentId: 's2', studentName: 'Ayşe Demir', date: '2024-12-12', checkInTime: '08:45', status: 'late', verificationMethod: 'face_recognition', confidenceScore: 0.92 },
    { id: '3', studentId: 's3', studentName: 'Mehmet Kaya', date: '2024-12-12', status: 'absent', verificationMethod: 'manual' },
    { id: '4', studentId: 's4', studentName: 'Zeynep Arslan', date: '2024-12-12', checkInTime: '08:10', checkOutTime: '16:05', status: 'present', verificationMethod: 'face_recognition', confidenceScore: 0.98 },
    { id: '5', studentId: 's5', studentName: 'Emre Şahin', date: '2024-12-12', checkInTime: '08:05', status: 'present', verificationMethod: 'card' },
    { id: '6', studentId: 's6', studentName: 'Elif Öztürk', date: '2024-12-12', status: 'excused', verificationMethod: 'manual', notes: 'Doktor raporu' },
    { id: '7', studentId: 's7', studentName: 'Can Yıldırım', date: '2024-12-12', checkInTime: '08:20', checkOutTime: '15:30', status: 'present', verificationMethod: 'face_recognition', confidenceScore: 0.89 },
    { id: '8', studentId: 's8', studentName: 'Selin Koç', date: '2024-12-12', checkInTime: '08:08', status: 'present', verificationMethod: 'face_recognition', confidenceScore: 0.96 },
];

export default function AttendanceDashboardPage() {
    const [stats] = useState<AttendanceStatsData>(MOCK_STATS);
    const [records, setRecords] = useState<AttendanceRecord[]>(MOCK_RECORDS);
    const [filteredRecords, setFilteredRecords] = useState<AttendanceRecord[]>(MOCK_RECORDS);
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');


    // Apply filters
    useEffect(() => {
        let filtered = records;

        if (statusFilter !== 'all') {
            filtered = filtered.filter(r => r.status === statusFilter);
        }

        if (searchQuery) {
            filtered = filtered.filter(r =>
                r.studentName.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        setFilteredRecords(filtered);
    }, [records, statusFilter, searchQuery]);

    const handleExport = () => {
        // Create CSV
        const headers = ['Öğrenci', 'Tarih', 'Giriş', 'Çıkış', 'Durum', 'Doğrulama'];
        const rows = filteredRecords.map(r => [
            r.studentName,
            r.date,
            r.checkInTime || '-',
            r.checkOutTime || '-',
            r.status,
            r.verificationMethod,
        ]);

        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `yoklama-${selectedDate}.csv`;
        link.click();
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">📋 Yoklama Takibi</h1>
                            <p className="text-gray-500 text-sm mt-1">Günlük yoklama ve raporlama</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <button
                                onClick={handleExport}
                                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                            >
                                📥 Dışa Aktar
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
                {/* Stats Cards */}
                <AttendanceStats stats={stats} />

                {/* Filters */}
                <AttendanceFilters
                    statusFilter={statusFilter}
                    onStatusFilterChange={setStatusFilter}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                />

                {/* Attendance Table */}
                <AttendanceTable
                    records={filteredRecords}
                    onUpdateStatus={(id, status) => {
                        setRecords(prev => prev.map(r =>
                            r.id === id ? { ...r, status } : r
                        ));
                    }}
                />
            </div>
        </div>
    );
}
