"use client";

import React from 'react';
import { useDashboard } from './layout';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBullhorn,
    faCalendarAlt,
    faFolderOpen,
    faComments,
    faChalkboardTeacher,
    faClipboardList,
    faCheckSquare,
    faUserGraduate,
    faBookOpen,
    faBus
} from '@fortawesome/free-solid-svg-icons';

interface User {
    id: number;
    username: string;
    email: string;
    userType?: 'parent' | 'teacher';
}

interface DashboardApp {
    id: string;
    title: string;
    icon: any;
    color: string;
    description: string;
}

export default function DashboardPage() {
    const { user, loading, searchQuery } = useDashboard();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!user) return null;

    const commonApps: DashboardApp[] = [
        { id: 'announcements', title: 'Duyurular', icon: faBullhorn, color: '#0082c9', description: 'Okul duyuruları' },
        { id: 'calendar', title: 'Takvim', icon: faCalendarAlt, color: '#ef4b4b', description: 'Etkinlik takvimi' },
        { id: 'files', title: 'Dosyalar', icon: faFolderOpen, color: '#eca72c', description: 'Belgelerim' },
        { id: 'messages', title: 'Mesajlar', icon: faComments, color: '#44b700', description: 'İletişim' },
    ];

    const teacherApps: DashboardApp[] = [
        { id: 'class', title: 'Sınıfım', icon: faChalkboardTeacher, color: '#6c5ce7', description: 'Sınıf listesi' },
        { id: 'schedule', title: 'Ders Programı', icon: faClipboardList, color: '#0984e3', description: 'Haftalık program' },
        { id: 'attendance', title: 'Yoklama', icon: faCheckSquare, color: '#00b894', description: 'Yoklama girişi' },
    ];

    const parentApps: DashboardApp[] = [
        { id: 'student', title: 'Öğrenci Durumu', icon: faUserGraduate, color: '#6c5ce7', description: 'Gelişim raporu' },
        { id: 'homework', title: 'Ödevler', icon: faBookOpen, color: '#0984e3', description: 'Ödev takibi' },
        { id: 'shuttle', title: 'Servis', icon: faBus, color: '#e17055', description: 'Servis bilgisi' },
    ];

    const allApps = [
        ...commonApps,
        ...(user.userType === 'teacher' ? teacherApps : parentApps)
    ];

    const filteredApps = allApps.filter(app =>
        app.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header Section */}
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-12">
                <div className="text-center md:text-left mb-6 md:mb-0">
                    <h1 className="text-3xl font-display font-bold text-neutral-dark leading-normal pb-1">
                        {user.userType === 'teacher' ? 'Öğretmen Paneli' : 'Veli Paneli'}
                    </h1>
                    <p className="text-gray-600 mt-2 text-lg">
                        Hoş geldiniz, <span className="font-semibold text-primary">{user.username}</span>
                    </p>
                </div>

                {/* User Profile Card */}
                <div className="bg-white/80 backdrop-blur-md px-6 py-3 rounded-2xl shadow-sm border border-white/50 flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md ${user.userType === 'teacher' ? 'bg-indigo-500' : 'bg-orange-500'}`}>
                        {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-800">{user.username}</p>
                        <p className="text-xs text-gray-500 capitalize">{user.userType === 'teacher' ? 'Öğretmen' : 'Veli'}</p>
                    </div>
                </div>
            </div>

            {/* Apps Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {filteredApps.map((app) => (
                    <button
                        key={app.id}
                        className="group bg-white/80 backdrop-blur-md p-6 rounded-3xl shadow-sm hover:shadow-xl hover:scale-105 hover:bg-white transition-all duration-300 border border-white/50 flex flex-col items-center justify-center text-center aspect-square"
                        onClick={() => alert(`${app.title} modülü yakında eklenecektir.`)}
                    >
                        <div
                            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 text-3xl shadow-inner transition-transform duration-300 group-hover:rotate-3"
                            style={{ backgroundColor: `${app.color}15`, color: app.color }}
                        >
                            <FontAwesomeIcon icon={app.icon} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 mb-1 group-hover:text-primary transition-colors">
                            {app.title}
                        </h3>
                        <p className="text-xs text-gray-500 font-medium">
                            {app.description}
                        </p>
                    </button>
                ))}
            </div>
        </div>
    );
}
