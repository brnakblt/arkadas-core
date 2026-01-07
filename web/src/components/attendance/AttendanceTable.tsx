'use client';

import { useState } from 'react';

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

interface AttendanceTableProps {
    records: AttendanceRecord[];
    onUpdateStatus: (id: string, status: AttendanceRecord['status']) => void;
}

export default function AttendanceTable({ records, onUpdateStatus }: AttendanceTableProps) {
    const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);

    const getStatusBadge = (status: AttendanceRecord['status']) => {
        const styles = {
            present: 'bg-green-100 text-green-700',
            absent: 'bg-red-100 text-red-700',
            late: 'bg-yellow-100 text-yellow-700',
            excused: 'bg-blue-100 text-blue-700',
        };
        const labels = {
            present: 'Geldi',
            absent: 'Gelmedi',
            late: 'Geç Kaldı',
            excused: 'İzinli',
        };
        return (
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status]}`}>
                {labels[status]}
            </span>
        );
    };

    const getVerificationIcon = (method: AttendanceRecord['verificationMethod']) => {
        const icons = {
            face_recognition: '🤖',
            manual: '✏️',
            card: '💳',
        };
        return icons[method];
    };

    if (records.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <span className="text-4xl">📭</span>
                <p className="text-gray-500 mt-2">Kayıt bulunamadı</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="text-left py-4 px-5 font-semibold text-gray-700">Öğrenci</th>
                            <th className="text-left py-4 px-5 font-semibold text-gray-700">Giriş</th>
                            <th className="text-left py-4 px-5 font-semibold text-gray-700">Çıkış</th>
                            <th className="text-left py-4 px-5 font-semibold text-gray-700">Durum</th>
                            <th className="text-left py-4 px-5 font-semibold text-gray-700">Doğrulama</th>
                            <th className="text-left py-4 px-5 font-semibold text-gray-700">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {records.map((record) => (
                            <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                                {/* Student */}
                                <td className="py-4 px-5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-medium">
                                            {record.studentName.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{record.studentName}</p>
                                            <p className="text-sm text-gray-500">{record.studentId}</p>
                                        </div>
                                    </div>
                                </td>

                                {/* Check In */}
                                <td className="py-4 px-5">
                                    {record.checkInTime ? (
                                        <span className="font-medium text-gray-900">{record.checkInTime}</span>
                                    ) : (
                                        <span className="text-gray-400">-</span>
                                    )}
                                </td>

                                {/* Check Out */}
                                <td className="py-4 px-5">
                                    {record.checkOutTime ? (
                                        <span className="font-medium text-gray-900">{record.checkOutTime}</span>
                                    ) : (
                                        <span className="text-gray-400">-</span>
                                    )}
                                </td>

                                {/* Status */}
                                <td className="py-4 px-5">
                                    {getStatusBadge(record.status)}
                                </td>

                                {/* Verification */}
                                <td className="py-4 px-5">
                                    <div className="flex items-center gap-2">
                                        <span>{getVerificationIcon(record.verificationMethod)}</span>
                                        {record.confidenceScore && (
                                            <span className="text-sm text-gray-500">
                                                {(record.confidenceScore * 100).toFixed(0)}%
                                            </span>
                                        )}
                                    </div>
                                </td>

                                {/* Actions */}
                                <td className="py-4 px-5">
                                    <div className="flex items-center gap-2">
                                        <select
                                            value={record.status}
                                            onChange={(e) => onUpdateStatus(record.id, e.target.value as AttendanceRecord['status'])}
                                            className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="present">Geldi</option>
                                            <option value="absent">Gelmedi</option>
                                            <option value="late">Geç Kaldı</option>
                                            <option value="excused">İzinli</option>
                                        </select>
                                        <button
                                            onClick={() => setSelectedRecord(record)}
                                            className="p-1 text-gray-400 hover:text-gray-600"
                                        >
                                            ℹ️
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Detail Modal */}
            {selectedRecord && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-lg font-bold text-gray-900">Yoklama Detayı</h3>
                            <button
                                onClick={() => setSelectedRecord(null)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-medium text-lg">
                                    {selectedRecord.studentName.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900">{selectedRecord.studentName}</p>
                                    <p className="text-sm text-gray-500">{selectedRecord.date}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                                <div>
                                    <p className="text-sm text-gray-500">Giriş Saati</p>
                                    <p className="font-medium">{selectedRecord.checkInTime || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Çıkış Saati</p>
                                    <p className="font-medium">{selectedRecord.checkOutTime || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Doğrulama Yöntemi</p>
                                    <p className="font-medium">
                                        {selectedRecord.verificationMethod === 'face_recognition' && '🤖 Yüz Tanıma'}
                                        {selectedRecord.verificationMethod === 'manual' && '✏️ Manuel'}
                                        {selectedRecord.verificationMethod === 'card' && '💳 Kart'}
                                    </p>
                                </div>
                                {selectedRecord.confidenceScore && (
                                    <div>
                                        <p className="text-sm text-gray-500">Güven Skoru</p>
                                        <p className="font-medium">{(selectedRecord.confidenceScore * 100).toFixed(1)}%</p>
                                    </div>
                                )}
                            </div>

                            {selectedRecord.notes && (
                                <div className="pt-3 border-t">
                                    <p className="text-sm text-gray-500">Notlar</p>
                                    <p className="text-gray-700">{selectedRecord.notes}</p>
                                </div>
                            )}
                        </div>

                        <div className="mt-6">
                            <button
                                onClick={() => setSelectedRecord(null)}
                                className="w-full py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Kapat
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
