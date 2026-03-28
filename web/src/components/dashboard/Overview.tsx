"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { studentService } from '@/services/studentService';
import {
    Users, BrainCircuit, Fingerprint, Activity, MessageSquare, X, AlertTriangle
} from 'lucide-react';

const Overview: React.FC = () => {
    const [openModal, setOpenModal] = useState<string | null>(null);
    const [activeStudentCount, setActiveStudentCount] = useState<number | null>(null);
    const router = useRouter();

    React.useEffect(() => {
        studentService.getStudentStats()
            .then(stats => setActiveStudentCount(stats.active))
            .catch(console.error);
    }, []);

    const handleNavigation = (href: string) => {
        router.push(href);
        setOpenModal(null);
    };

    const modules = [
        {
            id: 'personel', title: 'Personel', icon: <Users size={32} />, color: 'from-primary-light to-primary', columns: [
                { title: 'Tanımlar', items: [{ label: 'Eğitimci Tanımları' }, { label: 'Personel Tanımları', target: '/dashboard/personnel' }] },
                { title: 'Parametreler', items: [{ label: 'Tatil Tanımları' }] }
            ]
        },
        {
            id: 'bep', title: 'BEP İşlemleri', icon: <BrainCircuit size={32} />, color: 'from-secondary-light to-secondary', columns: [
                { title: 'İşlemler', items: [{ label: 'BEP Planı Oluştur', target: '/dashboard/bep-ai' }, { label: 'Kaba Değerlendirme' }] }
            ]
        },
        { id: 'damar', title: 'Damar Okuma', icon: <Fingerprint size={32} />, color: 'from-primary to-primary-dark', direct: '/dashboard/bsdk' },
        {
            id: 'uyarilar', title: 'Uyarılar', icon: <AlertTriangle size={32} />, color: 'from-orange-400 to-orange-600', columns: [
                { title: 'Kritik Uyarılar', items: [{ label: 'Raporu Bitenler [30]' }, { label: 'Doğum Günleri [10]' }] }
            ]
        },
        { id: 'materyal', title: 'Materyal Üret', icon: <Activity size={32} />, color: 'from-primary-dark to-primary', direct: '/dashboard/materials' },
        { id: 'chat', title: 'AI Asistan', icon: <MessageSquare size={32} />, color: 'from-secondary to-secondary-dark', direct: '/dashboard/chat' }
    ];

    const currentModule = modules.find(m => m.id === openModal);

    return (
        <div className="space-y-8 animate-fade-in p-2">
            <header>
                <h2 className="text-2xl font-bold text-slate-800">Komuta Merkezi</h2>
                <p className="text-slate-500">Hızlı erişim ve kurum yönetimi</p>
            </header>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {modules.map((mod) => (
                    <button
                        key={mod.id}
                        onClick={() => mod.direct ? router.push(mod.direct) : setOpenModal(mod.id)}
                        className="flex flex-col items-center gap-3 p-4 rounded-2xl hover:bg-white hover:shadow-xl hover:scale-105 transition-all group bg-white shadow-sm border border-slate-100"
                    >
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg bg-gradient-to-br ${mod.color}`}>
                            {mod.icon}
                        </div>
                        <span className="text-sm font-bold text-slate-700 text-center">{mod.title}</span>
                    </button>
                ))}
            </div>

            {openModal && currentModule && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={() => setOpenModal(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in" onClick={e => e.stopPropagation()}>
                        <div className="bg-primary p-4 flex justify-between items-center text-white">
                            <h3 className="font-bold text-lg">{currentModule.title}</h3>
                            <button 
                                onClick={() => setOpenModal(null)} 
                                aria-label="Kapat"
                                className="hover:bg-white/20 rounded-full p-1 transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                            {currentModule.columns?.map((col, i) => (
                                <div key={i} className="space-y-4">
                                    <h4 className="font-bold text-slate-400 uppercase text-xs tracking-widest border-b pb-2">{col.title}</h4>
                                    <ul className="space-y-2">
                                        {col.items.map((item, j) => (
                                            <li key={j}>
                                                <button
                                                    onClick={() => { if (item.target) handleNavigation(item.target); }}
                                                    className={`text-sm font-medium flex items-center gap-2 group w-full text-left py-1 ${item.target ? 'text-slate-600 hover:text-primary' : 'text-slate-400 cursor-not-allowed'}`}
                                                >
                                                    <div className={`w-1.5 h-1.5 rounded-full ${item.target ? 'bg-slate-300 group-hover:bg-primary' : 'bg-slate-200'}`}></div>
                                                    {item.label}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-12">
                <div className="bg-gradient-to-br from-primary to-primary-dark p-6 rounded-2xl text-white shadow-lg relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><Users size={64} /></div>
                    <p className="text-primary-light text-sm font-medium uppercase tracking-wider">Aktif Öğrenci</p>
                    <h4 className="text-4xl font-bold mt-2">{activeStudentCount !== null ? activeStudentCount : '-'}</h4>
                </div>
                <div className="bg-gradient-to-br from-secondary to-secondary-dark p-6 rounded-2xl text-white shadow-lg relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><Activity size={64} /></div>
                    <p className="text-secondary-light text-sm font-medium uppercase tracking-wider">Tamamlanan Seans</p>
                    <h4 className="text-4xl font-bold mt-2">42</h4>
                </div>
                <div className="bg-gradient-to-br from-primary-dark to-slate-800 p-6 rounded-2xl text-white shadow-lg relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><Fingerprint size={64} /></div>
                    <p className="text-primary-light text-sm font-medium uppercase tracking-wider">BSDK Başarı Oranı</p>
                    <h4 className="text-4xl font-bold mt-2">%98</h4>
                </div>
                <StorageStatsCard />
            </div>
        </div>
    );
};

const StorageStatsCard = () => {
    const [stats, setStats] = useState<{ used: number; count: number } | null>(null);

    React.useEffect(() => {
        fetch('/api/storage?action=stats')
            .then(res => res.json())
            .then(data => setStats(data))
            .catch(err => console.error(err));
    }, []);

    if (!stats) {
        return (
            <div className="bg-slate-700 p-6 rounded-2xl text-white shadow-lg animate-pulse">
                <p className="text-slate-300 text-sm">Depolama</p>
                <h4 className="text-4xl font-bold mt-2">-</h4>
            </div>
        );
    }

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + ['B', 'KB', 'MB', 'GB'][i];
    };

    return (
        <div className="bg-gradient-to-br from-slate-700 to-slate-900 p-6 rounded-2xl text-white shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><Activity size={64} /></div>
            <div className="flex justify-between items-start relative z-10">
                <div>
                    <p className="text-slate-300 text-sm font-medium uppercase tracking-wider">Depolama</p>
                    <h4 className="text-4xl font-bold mt-2">{formatSize(stats.used)}</h4>
                </div>
                <div className="text-right">
                    <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Dosya Sayısı</p>
                    <p className="font-semibold text-xl">{stats.count}</p>
                </div>
            </div>
        </div>
    );
};

export default Overview;
