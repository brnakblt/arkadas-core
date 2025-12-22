'use client';

// Skip prerendering for static export
export const dynamic = 'force-static';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { authFetch } from '@/lib/auth';
import { LineChart, StatCard } from '@/components/charts/DashboardCharts';
import { exportToPDF } from '@/lib/reportExport';

// ============================================================
// Types
// ============================================================

interface Student {
    id: number;
    attributes: {
        firstName: string;
        lastName: string;
        birthDate: string;
        enrollmentDate: string;
        specialNeeds?: string;
    };
}

interface ProgressNote {
    id: number;
    attributes: {
        date: string;
        category: string;
        score: number;
        notes: string;
    };
}

// ============================================================
// Data Fetching
// ============================================================

async function fetchStudents() {
    const response = await authFetch<{ data: Student[] }>(
        '/api/student-profiles?filters[isActive][$eq]=true&pagination[pageSize]=100'
    );
    return response.data;
}

async function fetchProgressNotes(studentId: number) {
    const response = await authFetch<{ data: ProgressNote[] }>(
        `/api/progress-notes?filters[student][id][$eq]=${studentId}&sort=date:asc&pagination[pageSize]=100`
    );
    return response.data;
}

// ============================================================
// Progress Categories
// ============================================================

const categories = [
    { id: 'academic', label: 'Akademik', color: '#3b82f6' },
    { id: 'social', label: 'Sosyal', color: '#10b981' },
    { id: 'motor', label: 'Motor Beceri', color: '#f59e0b' },
    { id: 'communication', label: 'İletişim', color: '#8b5cf6' },
    { id: 'self-care', label: 'Öz Bakım', color: '#ec4899' },
];

// ============================================================
// Component
// ============================================================

export default function StudentProgressReport() {
    const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    const { data: students = [], isLoading: loadingStudents } = useQuery({
        queryKey: ['students'],
        queryFn: fetchStudents,
    });

    const { data: progressNotes = [], isLoading: loadingProgress } = useQuery({
        queryKey: ['progress', selectedStudentId],
        queryFn: () => fetchProgressNotes(selectedStudentId as number),
        enabled: !!selectedStudentId,
    });

    const selectedStudent = students.find(s => s.id === selectedStudentId);

    // Filter notes by category
    const filteredNotes = selectedCategory === 'all'
        ? progressNotes
        : progressNotes.filter(n => n.attributes.category === selectedCategory);

    // Calculate averages per category
    const categoryAverages = categories.map(cat => {
        const catNotes = progressNotes.filter(n => n.attributes.category === cat.id);
        const avg = catNotes.length > 0
            ? catNotes.reduce((sum, n) => sum + n.attributes.score, 0) / catNotes.length
            : 0;
        return { ...cat, average: Math.round(avg * 10) / 10 };
    });

    // Line chart data
    const chartData = filteredNotes.map(note => ({
        label: new Date(note.attributes.date).toLocaleDateString('tr-TR', {
            month: 'short',
            day: 'numeric'
        }),
        value: note.attributes.score,
        color: categories.find(c => c.id === note.attributes.category)?.color || '#6b7280',
    }));

    // Overall progress
    const overallProgress = categoryAverages.reduce((sum, c) => sum + c.average, 0) / categories.length;


    // Export handler
    const handleExportPDF = () => {
        if (!selectedStudent) return;

        const tableHtml = `
            <table><thead><tr><th>Kategori</th><th>Ortalama</th><th>Değerlendirme</th></tr></thead>
            <tbody>${categoryAverages.map(c => `<tr><td>${c.label}</td><td>${c.average.toFixed(1)}</td><td>${c.average >= 4 ? 'Çok İyi' : c.average >= 3 ? 'İyi' : 'Gelişiyor'}</td></tr>`).join('')}</tbody></table>
            <p>Toplam: ${progressNotes.length} | Ortalama: ${overallProgress.toFixed(1)}/5</p>
        `;
        exportToPDF({
            title: `Öğrenci İlerleme Raporu`,
            subtitle: `${selectedStudent.attributes.firstName} ${selectedStudent.attributes.lastName}`,
            date: new Date().toLocaleDateString('tr-TR'),
            content: tableHtml,
        });
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Öğrenci İlerleme Raporu
                </h1>

                <div className="flex items-center gap-4">
                    {/* Student Selector */}
                    <select
                        value={selectedStudentId || ''}
                        onChange={(e) => setSelectedStudentId(Number(e.target.value) || null)}
                        className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600 min-w-[200px]"
                    >
                        <option value="">Öğrenci Seçin</option>
                        {students.map(student => (
                            <option key={student.id} value={student.id}>
                                {student.attributes.firstName} {student.attributes.lastName}
                            </option>
                        ))}
                    </select>

                    {selectedStudentId && (
                        <button
                            onClick={handleExportPDF}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                            PDF İndir
                        </button>
                    )}
                </div>
            </div>

            {loadingStudents ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
                </div>
            ) : !selectedStudentId ? (
                <div className="text-center py-16 text-gray-500">
                    <p className="text-xl">Rapor görüntülemek için öğrenci seçin</p>
                </div>
            ) : loadingProgress ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
                </div>
            ) : (
                <>
                    {/* Student Info */}
                    {selectedStudent && (
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                                    {selectedStudent.attributes.firstName[0]}
                                    {selectedStudent.attributes.lastName[0]}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold">
                                        {selectedStudent.attributes.firstName} {selectedStudent.attributes.lastName}
                                    </h2>
                                    <p className="text-gray-500">
                                        Kayıt: {new Date(selectedStudent.attributes.enrollmentDate).toLocaleDateString('tr-TR')}
                                    </p>
                                    {selectedStudent.attributes.specialNeeds && (
                                        <p className="text-sm text-blue-600 mt-1">
                                            {selectedStudent.attributes.specialNeeds}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        {categoryAverages.map((cat, idx) => (
                            <StatCard
                                key={cat.id}
                                title={cat.label}
                                value={cat.average}
                                change={0.2}
                                color={(['blue', 'green', 'yellow', 'purple', 'red'] as const)[idx % 5]}
                            />
                        ))}
                    </div>

                    {/* Category Filter */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setSelectedCategory('all')}
                            className={`px-4 py-2 rounded-lg ${selectedCategory === 'all'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-700'
                                }`}
                        >
                            Tümü
                        </button>
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`px-4 py-2 rounded-lg ${selectedCategory === cat.id
                                    ? 'text-white'
                                    : 'bg-gray-100 dark:bg-gray-700'
                                    }`}
                                style={selectedCategory === cat.id ? { backgroundColor: cat.color } : {}}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>

                    {/* Progress Chart */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
                        <h2 className="text-lg font-semibold mb-4">İlerleme Grafiği</h2>
                        {chartData.length > 0 ? (
                            <LineChart data={chartData} height={300} />
                        ) : (
                            <p className="text-center text-gray-500 py-8">
                                Bu kategori için henüz veri yok
                            </p>
                        )}
                    </div>

                    {/* Notes List */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
                        <h2 className="text-lg font-semibold mb-4">Değerlendirme Notları</h2>
                        <div className="space-y-4">
                            {filteredNotes.length === 0 ? (
                                <p className="text-gray-500">Henüz değerlendirme notu yok</p>
                            ) : (
                                filteredNotes.slice(-10).reverse().map(note => (
                                    <div
                                        key={note.id}
                                        className="p-4 border rounded-lg dark:border-gray-600"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span
                                                className="px-2 py-1 rounded text-sm text-white"
                                                style={{
                                                    backgroundColor: categories.find(c => c.id === note.attributes.category)?.color
                                                }}
                                            >
                                                {categories.find(c => c.id === note.attributes.category)?.label}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-gray-500">
                                                    {new Date(note.attributes.date).toLocaleDateString('tr-TR')}
                                                </span>
                                                <span className="font-bold">
                                                    {note.attributes.score}/5
                                                </span>
                                            </div>
                                        </div>
                                        <p className="text-gray-700 dark:text-gray-300">
                                            {note.attributes.notes}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
