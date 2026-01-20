"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard, Briefcase, Camera,
    BrainCircuit, Image as ImageIcon, MessageSquare,
    Settings, LogOut, GraduationCap
} from 'lucide-react';

const DashboardSidebar: React.FC = () => {
    const pathname = usePathname();

    const menuGroups = [
        {
            title: "Yönetim Paneli",
            items: [
                { id: 'dashboard', label: 'Ana Menü', icon: <LayoutDashboard size={18} />, href: '/dashboard' },
                { id: 'students', label: 'Öğrenci Yönetimi', icon: <GraduationCap size={18} />, href: '/dashboard/students' },
                { id: 'personnel', label: 'Personel Yönetimi', icon: <Briefcase size={18} />, href: '/dashboard/personnel' },
                { id: 'bsdk', label: 'BSDK & Yoklama', icon: <Camera size={18} />, href: '/dashboard/bsdk' },
            ]
        },
        {
            title: "Yapay Zeka Araçları",
            items: [
                { id: 'bep-ai', label: 'BEP Asistanı', icon: <BrainCircuit size={18} />, href: '/dashboard/bep-ai' },
                { id: 'materials', label: 'Materyal Üretimi', icon: <ImageIcon size={18} />, href: '/dashboard/materials' },
                { id: 'chat', label: 'Akıllı Asistan', icon: <MessageSquare size={18} />, href: '/dashboard/chat' },
            ]
        }
    ];

    const isActive = (href: string) => {
        if (href === '/dashboard' && pathname === '/dashboard') return true;
        if (href !== '/dashboard' && pathname?.startsWith(href)) return true;
        return false;
    };

    return (
        <aside className="w-64 bg-white border-r border-slate-200 h-screen fixed left-0 top-0 flex-col z-20 hidden md:flex shadow-xl">
            <div className="h-20 bg-gradient-to-r from-blue-600 to-indigo-700 flex items-center px-6 relative overflow-hidden shrink-0">
                <div className="relative z-10 flex items-center gap-3 text-white">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center border border-white/30 font-bold text-lg">A</div>
                    <div>
                        <h1 className="font-bold text-lg leading-tight">Arkadaş</h1>
                        <p className="text-[10px] text-blue-100 opacity-80 uppercase tracking-widest">Özel Eğitim ERP</p>
                    </div>
                </div>
            </div>
            <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-6">
                {menuGroups.map((group, idx) => (
                    <div key={idx}>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-3">{group.title}</h3>
                        <ul className="space-y-1">
                            {group.items.map((item) => {
                                const active = isActive(item.href);
                                return (
                                    <li key={item.id}>
                                        <Link
                                            href={item.href}
                                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${active ? 'bg-blue-50 text-blue-700 font-semibold shadow-sm' : 'text-slate-600 hover:bg-slate-50'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className={active ? 'text-blue-600' : 'text-slate-400'}>{item.icon}</span>
                                                <span className="text-sm">{item.label}</span>
                                            </div>
                                            {active && <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}
            </nav>
            <div className="p-4 border-t border-slate-100 bg-slate-50 shrink-0">
                <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-white transition-colors cursor-pointer group">
                    <div className="w-10 h-10 rounded-full border-2 border-white shadow-sm bg-slate-200 flex items-center justify-center text-slate-500 font-bold">AY</div>
                    <div className="flex-1 truncate"><p className="text-sm font-bold text-slate-800">Ahmet Yılmaz</p><p className="text-xs text-slate-500">Müdür</p></div>
                    <Settings size={16} className="text-slate-400 group-hover:text-slate-600" />
                </div>
                <button className="mt-2 w-full flex items-center justify-center gap-2 text-xs font-medium text-slate-500 hover:text-red-600 py-1.5 transition-colors"><LogOut size={14} /> Çıkış</button>
            </div>
        </aside>
    );
};

export default DashboardSidebar;
