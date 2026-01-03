'use client';

/**
 * Face Management Page
 * Manage student face enrollments for face recognition attendance
 */

import React, { useState, useEffect, useCallback } from 'react';

// ============================================================
// Types
// ============================================================

interface Student {
    id: number;
    documentId: string;
    firstName: string;
    lastName: string;
    fullName: string;
    photo?: { url: string };
    hasFaceEncoding: boolean;
    faceEncodingDate?: string;
}

// ============================================================
// Components
// ============================================================

const StudentCard: React.FC<{
    student: Student;
    onEnroll: (student: Student) => void;
    onDelete: (student: Student) => void;
}> = ({ student, onEnroll, onDelete }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4">
            {/* Photo */}
            <div className="relative">
                {student.photo?.url ? (
                    <img
                        src={student.photo.url}
                        alt={student.fullName}
                        className="w-16 h-16 rounded-full object-cover"
                    />
                ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-2xl">
                        {student.firstName?.charAt(0) || '?'}
                    </div>
                )}
                {/* Enrollment Badge */}
                <div
                    className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs ${student.hasFaceEncoding
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                        }`}
                >
                    {student.hasFaceEncoding ? '✓' : '?'}
                </div>
            </div>

            {/* Info */}
            <div className="flex-1">
                <h3 className="font-medium text-gray-900 dark:text-white">
                    {student.fullName}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    {student.hasFaceEncoding ? (
                        <>
                            <span className="text-green-600 dark:text-green-400">✅ Yüz kayıtlı</span>
                            {student.faceEncodingDate && (
                                <span className="ml-2 text-gray-400">
                                    ({new Date(student.faceEncodingDate).toLocaleDateString('tr-TR')})
                                </span>
                            )}
                        </>
                    ) : (
                        <span className="text-amber-600 dark:text-amber-400">⚠️ Yüz kaydedilmemiş</span>
                    )}
                </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
                {student.hasFaceEncoding ? (
                    <>
                        <button
                            onClick={() => onEnroll(student)}
                            className="px-3 py-1.5 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                        >
                            🔄 Güncelle
                        </button>
                        <button
                            onClick={() => onDelete(student)}
                            className="px-3 py-1.5 text-sm bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                        >
                            🗑️
                        </button>
                    </>
                ) : (
                    <button
                        onClick={() => onEnroll(student)}
                        className="px-3 py-1.5 text-sm bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                    >
                        📸 Kaydet
                    </button>
                )}
            </div>
        </div>
    </div>
);

const EnrollmentModal: React.FC<{
    student: Student | null;
    onClose: () => void;
    onSuccess: () => void;
}> = ({ student, onClose, onSuccess }) => {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setPreview(URL.createObjectURL(file));
            setError(null);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile || !student) return;

        setUploading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('user_id', `student_${student.id}`);
            formData.append('tenant_id', 'arkadas'); // TODO: Get from context

            const aiServiceUrl = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8000';
            const response = await fetch(`${aiServiceUrl}/api/encode-file`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.detail || 'Yüz kayıt işlemi başarısız');
            }

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.message || 'Yüz algılanamadı');
            }

            onSuccess();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Bir hata oluştu');
        } finally {
            setUploading(false);
        }
    };

    if (!student) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md">
                <div className="p-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        📸 Yüz Kaydı
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                        {student.fullName} için yüz fotoğrafı yükleyin
                    </p>

                    {error && (
                        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {/* Preview */}
                    <div className="mb-4">
                        {preview ? (
                            <div className="relative">
                                <img
                                    src={preview}
                                    alt="Preview"
                                    className="w-full h-64 object-cover rounded-lg"
                                />
                                <button
                                    onClick={() => {
                                        setSelectedFile(null);
                                        setPreview(null);
                                    }}
                                    className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                                >
                                    ×
                                </button>
                            </div>
                        ) : (
                            <label className="block w-full h-64 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                                <div className="flex flex-col items-center justify-center h-full">
                                    <span className="text-4xl mb-2">📷</span>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                        Fotoğraf yüklemek için tıklayın
                                    </span>
                                    <span className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                        JPG, PNG (max 10MB)
                                    </span>
                                </div>
                                <input
                                    type="file"
                                    accept="image/jpeg,image/png"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                            </label>
                        )}
                    </div>

                    {/* Tips */}
                    <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <h4 className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">
                            İpuçları:
                        </h4>
                        <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
                            <li>• Yüz net görünmeli ve doğrudan kameraya bakmalı</li>
                            <li>• İyi aydınlatılmış bir ortamda çekilmiş olmalı</li>
                            <li>• Gözlük, şapka gibi aksesuarlar çıkarılmalı</li>
                        </ul>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            İptal
                        </button>
                        <button
                            onClick={handleUpload}
                            disabled={!selectedFile || uploading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                            {uploading ? (
                                <>
                                    <span className="animate-spin">⏳</span>
                                    İşleniyor...
                                </>
                            ) : (
                                <>
                                    📤 Yükle & Kaydet
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ============================================================
// Main Page
// ============================================================

export default function FaceManagementPage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState<'all' | 'enrolled' | 'not-enrolled'>('all');
    const [enrollingStudent, setEnrollingStudent] = useState<Student | null>(null);

    const fetchStudents = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/admin/face-enrollments');

            if (!response.ok) {
                // Use mock data
                setStudents([
                    { id: 1, documentId: '1', firstName: 'Ahmet', lastName: 'Yılmaz', fullName: 'Ahmet Yılmaz', hasFaceEncoding: true, faceEncodingDate: '2024-01-15' },
                    { id: 2, documentId: '2', firstName: 'Ayşe', lastName: 'Demir', fullName: 'Ayşe Demir', hasFaceEncoding: true, faceEncodingDate: '2024-01-20' },
                    { id: 3, documentId: '3', firstName: 'Mehmet', lastName: 'Kaya', fullName: 'Mehmet Kaya', hasFaceEncoding: false },
                    { id: 4, documentId: '4', firstName: 'Fatma', lastName: 'Şahin', fullName: 'Fatma Şahin', hasFaceEncoding: false },
                    { id: 5, documentId: '5', firstName: 'Ali', lastName: 'Öztürk', fullName: 'Ali Öztürk', hasFaceEncoding: true, faceEncodingDate: '2024-02-01' },
                ]);
                return;
            }

            const data = await response.json();
            setStudents(data.students || []);
        } catch (error) {
            console.error('Failed to fetch students:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStudents();
    }, [fetchStudents]);

    const handleDeleteEnrollment = async (student: Student) => {
        if (!confirm(`${student.fullName} için yüz kaydını silmek istediğinize emin misiniz?`)) {
            return;
        }

        try {
            const aiServiceUrl = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8000';
            const response = await fetch(
                `${aiServiceUrl}/api/user/student_${student.id}?tenant_id=arkadas`,
                { method: 'DELETE' }
            );

            if (!response.ok) {
                throw new Error('Silme işlemi başarısız');
            }

            await fetchStudents();
        } catch (error) {
            alert('Yüz kaydı silinemedi: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata'));
        }
    };

    const filteredStudents = students.filter((s) => {
        const matchesSearch =
            s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.lastName.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesFilter =
            filter === 'all' ||
            (filter === 'enrolled' && s.hasFaceEncoding) ||
            (filter === 'not-enrolled' && !s.hasFaceEncoding);

        return matchesSearch && matchesFilter;
    });

    const stats = {
        total: students.length,
        enrolled: students.filter((s) => s.hasFaceEncoding).length,
        notEnrolled: students.filter((s) => !s.hasFaceEncoding).length,
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        📸 Yüz Tanıma Yönetimi
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Öğrenci yüz kayıtlarını yönetin
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Toplam Öğrenci</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
                    <p className="text-sm text-green-600 dark:text-green-400">Yüz Kayıtlı</p>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                        {stats.enrolled}
                        <span className="text-sm font-normal ml-1">
                            ({stats.total > 0 ? Math.round((stats.enrolled / stats.total) * 100) : 0}%)
                        </span>
                    </p>
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4">
                    <p className="text-sm text-amber-600 dark:text-amber-400">Kayıt Bekleyen</p>
                    <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{stats.notEnrolled}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <input
                    type="text"
                    placeholder="Öğrenci ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex gap-2">
                    {(['all', 'enrolled', 'not-enrolled'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                        >
                            {f === 'all' ? 'Tümü' : f === 'enrolled' ? '✅ Kayıtlı' : '⚠️ Bekleyen'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Student List */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                </div>
            ) : filteredStudents.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    {searchQuery ? 'Arama sonucu bulunamadı' : 'Henüz öğrenci yok'}
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredStudents.map((student) => (
                        <StudentCard
                            key={student.id}
                            student={student}
                            onEnroll={setEnrollingStudent}
                            onDelete={handleDeleteEnrollment}
                        />
                    ))}
                </div>
            )}

            {/* Enrollment Modal */}
            {enrollingStudent && (
                <EnrollmentModal
                    student={enrollingStudent}
                    onClose={() => setEnrollingStudent(null)}
                    onSuccess={() => {
                        fetchStudents();
                    }}
                />
            )}
        </div>
    );
}
