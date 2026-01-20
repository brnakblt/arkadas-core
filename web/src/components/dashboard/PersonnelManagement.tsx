"use client";

import React, { useState } from 'react';
import {
    Briefcase, Calendar, CheckCircle, XCircle, Clock, Star,
    BookOpen, User, Users, MoreVertical, Plus, ClipboardList, CheckSquare,
    TrendingUp, ChevronRight
} from 'lucide-react';
import { MOCK_STAFF, MOCK_LEAVE_REQUESTS, MOCK_TRAININGS, MOCK_LESSON_PLANS, MOCK_TASKS } from './constants';
// import { Staff } from './types';

const PersonnelManagement: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'planning' | 'tasks_leaves' | 'performance'>('planning');

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Active': return <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">Aktif</span>;
            case 'OnLeave': return <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-xs font-medium">İzinde</span>;
            case 'Terminated': return <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium">Ayrıldı</span>;
            default: return null;
        }
    };

    const getPriorityBadge = (priority: string) => {
        switch (priority) {
            case 'High': return <span className="text-red-600 bg-red-50 px-2 py-0.5 rounded text-xs font-bold border border-red-100">Yüksek</span>;
            case 'Medium': return <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded text-xs font-medium border border-amber-100">Orta</span>;
            case 'Low': return <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-xs font-medium border border-blue-100">Düşük</span>;
            default: return null;
        }
    };

    // --- TAB 1: KADRO & DERS PLANLAMA ---
    const renderPlanning = () => (
        <div className="space-y-6">
            {/* Staff List */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                        <Users size={18} className="text-slate-500" />
                        Personel Kadrosu
                    </h3>
                    <button className="bg-primary-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-primary-700 flex items-center gap-1">
                        <Plus size={16} /> Yeni Personel
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4">Personel</th>
                                <th className="px-6 py-4">Branş</th>
                                <th className="px-6 py-4">Haftalık Yük</th>
                                <th className="px-6 py-4">İletişim</th>
                                <th className="px-6 py-4">Durum</th>
                                <th className="px-6 py-4 text-right">İşlem</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {MOCK_STAFF.map((staff) => {
                                const maxHours = staff.maxWeeklyHours || 40;
                                const usagePercent = Math.min((staff.weeklyHours / maxHours) * 100, 100);
                                const isOverload = staff.weeklyHours > maxHours;

                                return (
                                    <tr key={staff.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {staff.avatarUrl ? (
                                                    <img src={staff.avatarUrl} alt={staff.fullName} className="w-10 h-10 rounded-full object-cover bg-slate-200" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold">
                                                        {staff.fullName.charAt(0)}
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-semibold text-slate-800">{staff.fullName}</p>
                                                    <p className="text-xs text-slate-500">Giriş: {staff.joinDate}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">{staff.specialty}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1.5 w-32">
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className="text-slate-500">Doluluk</span>
                                                    <span className={`font-semibold ${isOverload ? 'text-red-600' : 'text-slate-700'}`}>
                                                        {staff.weeklyHours}/{maxHours} Sa
                                                    </span>
                                                </div>
                                                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-500 ${isOverload ? 'bg-red-500' : 'bg-primary-500'}`}
                                                        style={{ width: `${usagePercent}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-slate-900">{staff.email}</p>
                                            <p className="text-xs text-slate-500">{staff.phone}</p>
                                        </td>
                                        <td className="px-6 py-4">{getStatusBadge(staff.status)}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-200">
                                                <MoreVertical size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Lesson Plans */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <ClipboardList className="text-primary-500" size={20} />
                            Haftalık Ders Planları
                        </h3>
                        <p className="text-sm text-slate-500">Öğretmenlerin sisteme yüklediği haftalık BEP planları.</p>
                    </div>
                    <button className="text-primary-600 text-sm font-medium hover:underline">Tümünü Gör</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {MOCK_LESSON_PLANS.map(plan => {
                        const staff = MOCK_STAFF.find(s => s.id === plan.staffId);
                        const isApproved = plan.status === 'Approved';
                        return (
                            <div key={plan.id} className="border border-slate-200 rounded-xl p-4 hover:shadow-md transition-all bg-white relative overflow-hidden">
                                {isApproved && <div className="absolute top-0 right-0 w-16 h-16 bg-green-500/10 rounded-bl-full z-0"></div>}
                                <div className="flex justify-between items-start mb-2 relative z-10">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 overflow-hidden">
                                            {staff?.avatarUrl ? (
                                                <img src={staff.avatarUrl} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                staff?.fullName.charAt(0)
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-800 text-sm">{staff?.fullName}</p>
                                            <p className="text-xs text-slate-500">Hafta {plan.week}</p>
                                        </div>
                                    </div>
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${isApproved ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                                        }`}>
                                        {plan.status === 'Approved' ? 'Onaylandı' : 'Beklemede'}
                                    </span>
                                </div>

                                <h4 className="font-bold text-slate-800 mb-1">{plan.subject}</h4>
                                <p className="text-sm text-slate-600 line-clamp-2 mb-3">{plan.description}</p>

                                <div className="flex justify-between items-center border-t border-slate-100 pt-3">
                                    <span className="text-xs text-slate-400">{plan.submissionDate}</span>
                                    <button className="text-primary-600 text-sm font-medium hover:text-primary-700 flex items-center gap-1">
                                        İncele <ChevronRight size={14} />
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    );

    // --- TAB 2: İZİN & GÖREVLENDİRME ---
    const renderTasksAndLeaves = () => (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Task Assignments */}
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <CheckSquare className="text-lila-500" size={20} />
                            Görevlendirmeler
                        </h3>
                        <button className="bg-slate-900 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-slate-800">
                            + Görev Ata
                        </button>
                    </div>

                    <div className="space-y-3">
                        {MOCK_TASKS.map(task => {
                            const staff = MOCK_STAFF.find(s => s.id === task.staffId);
                            return (
                                <div key={task.id} className="flex items-start gap-4 p-4 bg-white border border-slate-200 rounded-xl hover:border-primary-200 transition-colors group">
                                    <div className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center cursor-pointer ${task.status === 'Completed' ? 'bg-green-500 border-green-500' : 'border-slate-300 group-hover:border-primary-400'
                                        }`}>
                                        {task.status === 'Completed' && <CheckCircle size={12} className="text-white" />}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <h4 className={`font-semibold text-slate-800 ${task.status === 'Completed' ? 'line-through text-slate-400' : ''}`}>
                                                {task.title}
                                            </h4>
                                            {getPriorityBadge(task.priority)}
                                        </div>
                                        <p className="text-sm text-slate-600 mt-1 mb-2">{task.description}</p>
                                        <div className="flex items-center gap-3 text-xs text-slate-500">
                                            <div className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded">
                                                <User size={12} /> {staff?.fullName}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Clock size={12} /> Son: {task.dueDate}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Leave Requests */}
            <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Clock className="text-amber-500" size={20} />
                        İzin Talepleri
                    </h3>
                    <div className="space-y-4">
                        {MOCK_LEAVE_REQUESTS.filter(r => r.status === 'Pending').map(req => {
                            const staff = MOCK_STAFF.find(s => s.id === req.staffId);
                            return (
                                <div key={req.id} className="border border-slate-200 rounded-lg p-4 bg-amber-50/30">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-slate-800">{staff?.fullName}</span>
                                        </div>
                                        <span className="text-xs bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-600">{req.type}</span>
                                    </div>
                                    <p className="text-sm text-slate-600 mb-3 italic">&quot;{req.description}&quot;</p>
                                    <div className="flex justify-between items-center border-t border-slate-200/50 pt-2">
                                        <span className="text-xs font-mono text-slate-500">{req.startDate}</span>
                                        <div className="flex gap-2">
                                            <button className="p-1.5 text-red-600 hover:bg-red-50 rounded bg-white shadow-sm border border-slate-100"><XCircle size={18} /></button>
                                            <button className="p-1.5 text-green-600 hover:bg-green-50 rounded bg-white shadow-sm border border-slate-100"><CheckCircle size={18} /></button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                        {MOCK_LEAVE_REQUESTS.filter(r => r.status === 'Pending').length === 0 && (
                            <div className="text-center py-6 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                                <p className="text-slate-400 text-sm">Bekleyen talep yok.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Calendar className="text-primary-500" size={20} />
                        İzin Takvimi
                    </h3>
                    <div className="space-y-3">
                        {MOCK_LEAVE_REQUESTS.filter(r => r.status === 'Approved').map(req => {
                            const staff = MOCK_STAFF.find(s => s.id === req.staffId);
                            return (
                                <div key={req.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
                                    <div className="flex flex-col items-center justify-center w-12 h-12 bg-white rounded-lg border border-slate-200 shadow-sm">
                                        <span className="text-[10px] text-slate-400 uppercase font-bold">{new Date(req.startDate).toLocaleString('tr-TR', { month: 'short' })}</span>
                                        <span className="text-lg font-bold text-slate-800">{new Date(req.startDate).getDate()}</span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-slate-800">{staff?.fullName}</p>
                                        <p className="text-xs text-slate-500">{req.type} ({req.endDate} son)</p>
                                    </div>
                                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    );

    // --- TAB 3: GELİŞİM & PERFORMANS ---
    const renderPerformance = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {MOCK_STAFF.map(staff => (
                    <div key={staff.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 relative overflow-hidden group hover:shadow-md transition-shadow">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Star size={100} className="text-yellow-500" />
                        </div>

                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                {staff.avatarUrl ? (
                                    <img src={staff.avatarUrl} alt={staff.fullName} className="w-12 h-12 rounded-full object-cover shadow-sm bg-slate-200" />
                                ) : (
                                    <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center text-lg font-bold text-slate-600 shadow-inner">
                                        {staff.fullName.charAt(0)}
                                    </div>
                                )}
                                <div>
                                    <h4 className="font-bold text-slate-800">{staff.fullName}</h4>
                                    <p className="text-xs text-slate-500">{staff.specialty}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-2xl font-bold text-primary-600">{staff.performanceScore || 0}</span>
                                <p className="text-[10px] uppercase tracking-wider text-slate-400">Puan</p>
                            </div>
                        </div>

                        <div className="space-y-4 mb-6">
                            <div>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-slate-500">BEP & Ders Raporlama</span>
                                    <span className="font-medium text-slate-700">%95</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-1.5">
                                    <div className="bg-green-500 h-1.5 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.3)]" style={{ width: '95%' }}></div>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-slate-500">Veli Memnuniyeti</span>
                                    <span className="font-medium text-slate-700">%88</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-1.5">
                                    <div className="bg-primary-500 h-1.5 rounded-full" style={{ width: '88%' }}></div>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-slate-100 pt-3">
                            <h5 className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1 uppercase tracking-wide">
                                <BookOpen size={12} /> Eğitim Geçmişi
                            </h5>
                            <ul className="space-y-2">
                                {MOCK_TRAININGS.filter(t => t.staffId === staff.id).map(t => (
                                    <li key={t.id} className="text-xs text-slate-600 flex items-start gap-2">
                                        <div className={`mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${t.status === 'Completed' ? 'bg-green-500' : 'bg-amber-500'}`}></div>
                                        <span className="line-clamp-1 hover:line-clamp-none transition-all cursor-default" title={t.title}>{t.title}</span>
                                    </li>
                                ))}
                                {MOCK_TRAININGS.filter(t => t.staffId === staff.id).length === 0 && <li className="text-xs text-slate-400 italic">Kayıtlı eğitim yok</li>}
                            </ul>
                        </div>
                    </div>
                ))}
            </div>

            {/* AI Analysis Box */}
            <div className="bg-gradient-to-r from-lila-50 to-white border border-lila-100 rounded-xl p-6 flex items-start gap-4 shadow-sm">
                <div className="p-3 bg-white rounded-lg shadow-sm text-lila-600 border border-lila-100">
                    <TrendingUp size={24} />
                </div>
                <div>
                    <h4 className="font-bold text-slate-800 mb-1 flex items-center gap-2">
                        Yapay Zeka Performans Önerisi
                        <span className="text-[10px] bg-lila-100 text-lila-700 px-2 py-0.5 rounded-full">Gemini Analysis</span>
                    </h4>
                    <p className="text-sm text-slate-600 leading-relaxed">
                        Kurum genelinde <strong>&quot;Duyu Bütünleme&quot;</strong> konusunda eğitim talebi artışı gözlemleniyor.
                        Elif Öğretmen&apos;in BEP raporlama hızı geçen aya göre <strong>%15 arttı</strong>, personel motivasyonu için &quot;Ayın Personeli&quot; ödülüne aday gösterilmesi önerilir.
                        Burak Hoca&apos;nın materyal eksiklik bildirimleri bu hafta yoğunlaştı, envanter kontrolü yapılmalı.
                    </p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b border-slate-200 pb-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Personel Yönetimi</h2>
                    <p className="text-slate-500">İnsan kaynakları, eğitim planlama ve performans değerlendirme</p>
                </div>
                <div className="flex bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                    <button
                        onClick={() => setActiveTab('planning')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'planning' ? 'bg-slate-800 text-white shadow' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                        Kadro & Planlama
                    </button>
                    <button
                        onClick={() => setActiveTab('tasks_leaves')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'tasks_leaves' ? 'bg-slate-800 text-white shadow' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                        İzin & Görevlendirme
                    </button>
                    <button
                        onClick={() => setActiveTab('performance')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'performance' ? 'bg-slate-800 text-white shadow' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                        Gelişim & Performans
                    </button>
                </div>
            </div>

            <div className="animate-fade-in min-h-[500px]">
                {activeTab === 'planning' && renderPlanning()}
                {activeTab === 'tasks_leaves' && renderTasksAndLeaves()}
                {activeTab === 'performance' && renderPerformance()}
            </div>
        </div>
    );
};

export default PersonnelManagement;
