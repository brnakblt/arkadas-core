"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { studentService, Student } from '@/services/studentService';
import { Search, Filter, MoreVertical, Loader2, Plus } from 'lucide-react';

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
                    <p className="text-slate-500 text-sm">Kayıtlı öğrencilerin listesi ve durumları</p>
                </div>
                <button className="bg-primary text-white px-5 py-2.5 rounded-xl font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 flex items-center gap-2 active:scale-95 transform">
                    <Plus size={20} />
                    Yeni Öğrenci
                </button>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <Loader2 className="animate-spin text-primary mb-4" size={40} />
                    <p className="text-slate-400 font-medium">Veriler hazırlanıyor...</p>
                </div>
            ) : error ? (
                <div className="bg-red-50 text-red-600 p-6 rounded-2xl border border-red-100 flex items-center gap-3">
                    <span className="text-2xl">⚠️</span>
                    <p className="font-medium">{error}</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden ring-1 ring-slate-200/50">
                    <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row gap-4 bg-slate-50/30">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="İsim veya TC No ile ara..."
                                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button className="flex items-center justify-center gap-2 px-5 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-white hover:border-primary/30 hover:text-primary transition-all font-medium bg-white shadow-sm">
                            <Filter size={18} />
                            <span>Filtrele</span>
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="bg-slate-50/50 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-b border-slate-100">
                                    <th className="px-6 py-4">Öğrenci</th>
                                    <th className="px-6 py-4">TC Kimlik</th>
                                    <th className="px-6 py-4">Tanı</th>
                                    <th className="px-6 py-4">RAM Bitiş</th>
                                    <th className="px-6 py-4">Veli</th>
                                    <th className="px-6 py-4">Durum</th>
                                    <th className="px-6 py-4 text-right">İşlem</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredStudents.length > 0 ? filteredStudents.map((student) => (
                                    <tr key={student.id} className="hover:bg-primary/5 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="relative w-10 h-10 shrink-0">
                                                    <Image 
                                                        src={student.avatarUrl || '/media/placeholder-user.png'} 
                                                        alt="" 
                                                        fill
                                                        className="rounded-full bg-slate-100 object-cover border-2 border-white shadow-sm" 
                                                    />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800 group-hover:text-primary transition-colors">{student.fullName}</p>
                                                    <p className="text-[11px] text-slate-400 font-medium">{student.birthDate} Doğumlu</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-slate-500 font-medium">{student.tcIdentity}</td>
                                        <td className="px-6 py-4">
                                            <span className="inline-block bg-primary/10 text-primary-dark px-2.5 py-1 rounded-lg text-[11px] font-bold border border-primary/10">
                                                {student.diagnosis}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 font-bold">{student.ramReportEndDate || '-'}</td>
                                        <td className="px-6 py-4">
                                            <p className="text-slate-700 font-semibold">{student.parentName || '-'}</p>
                                            <p className="text-[11px] text-slate-400 font-medium">{student.parentPhone || '-'}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide
                       ${student.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-secondary/10 text-secondary-dark'}
                     `}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${student.status === 'ACTIVE' ? 'bg-green-600' : 'bg-secondary'}`}></span>
                                                {student.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-slate-400 hover:text-primary p-2 rounded-xl hover:bg-primary/10 transition-all">
                                                <MoreVertical size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-medium">
                                            Öğrenci bulunamadı.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentList;
