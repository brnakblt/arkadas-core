"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { studentService, Student } from '@/services/studentService';
import { Search, Filter, MoreVertical, Loader2 } from 'lucide-react';
// import { StudentStatus } from './types'; // Removed to avoid lint error

const StudentList: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    React.useEffect(() => {
        const fetchStudents = async () => {
            try {
                const data = await studentService.getStudents();
                setStudents(data);
            } catch (err) {
                console.error(err);
                setError("Öğrenci listesi yüklenemedi.");
            } finally {
                setLoading(false);
            }
        };
        fetchStudents();
    }, []);

    const filteredStudents = students.filter(s =>
        s.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.tcIdentity?.includes(searchTerm)
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Öğrenci Yönetimi</h2>
                    <p className="text-slate-500">Kayıtlı öğrencilerin listesi ve durumları</p>
                </div>
                <button className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors shadow-sm">
                    + Yeni Öğrenci
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="animate-spin text-primary-500" size={32} />
                </div>
            ) : error ? (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200">
                    {error}
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type="text"
                                placeholder="İsim veya TC No ile ara..."
                                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">
                            <Filter size={18} />
                            <span className="hidden sm:inline">Filtrele</span>
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4">Öğrenci</th>
                                    <th className="px-6 py-4">TC Kimlik</th>
                                    <th className="px-6 py-4">Tanı</th>
                                    <th className="px-6 py-4">RAM Bitiş</th>
                                    <th className="px-6 py-4">Veli</th>
                                    <th className="px-6 py-4">Durum</th>
                                    <th className="px-6 py-4 text-right">İşlem</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredStudents.map((student) => (
                                    <tr key={student.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <Image src={student.avatarUrl} alt="" width={40} height={40} className="rounded-full bg-slate-200 object-cover" />
                                                <div>
                                                    <p className="font-semibold text-slate-800">{student.fullName}</p>
                                                    <p className="text-xs text-slate-500">{student.birthDate} Doğumlu</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-slate-500">{student.tcIdentity}</td>
                                        <td className="px-6 py-4">
                                            <span className="inline-block bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-medium border border-blue-100">
                                                {student.diagnosis}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-800">{student.ramReportEndDate}</td>
                                        <td className="px-6 py-4">
                                            <p className="text-slate-900">{student.parentName}</p>
                                            <p className="text-xs text-slate-500">{student.parentPhone}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium
                       ${student.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}
                     `}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${student.status === 'ACTIVE' ? 'bg-green-600' : 'bg-amber-600'}`}></span>
                                                {student.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-200">
                                                <MoreVertical size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentList;
