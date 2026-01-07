"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faHome,
    faFolder,
    faImages,
    faCog,
    faSignOutAlt,
    faBolt
} from '@fortawesome/free-solid-svg-icons';

const Sidebar = () => {
    const pathname = usePathname();
    const router = useRouter();

    const menuItems = [
        { id: 'dashboard', label: 'Panel', icon: faHome, path: '/dashboard' },
        { id: 'files', label: 'Dosyalar', icon: faFolder, path: '/dashboard/documents' },
        { id: 'photos', label: 'Fotoğraflar', icon: faImages, path: '/dashboard/photos' },
        { id: 'activity', label: 'Aktivite', icon: faBolt, path: '/dashboard/activity' },
    ];

    const handleLogout = () => {
        localStorage.removeItem('jwt');
        localStorage.removeItem('user');
        router.push('/');
    };

    return (
        <div className="w-64 bg-[#1b1b1b] text-white flex flex-col h-screen fixed left-0 top-0 z-50 transition-all duration-300">
            {/* Logo Area */}
            <div className="p-6 flex items-center justify-center border-b border-gray-800">
                <div className="relative w-32 h-12">
                    <Image
                        src="/images/logo.svg"
                        alt="Arkadaş Özel Eğitim"
                        fill
                        className="object-contain brightness-0 invert"
                    />
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
                {menuItems.map((item) => {
                    const isActive = pathname === item.path;
                    return (
                        <Link
                            key={item.id}
                            href={item.path}
                            className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                                ? 'bg-primary text-white shadow-lg shadow-primary/25'
                                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                }`}
                        >
                            <FontAwesomeIcon icon={item.icon} className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-white'}`} />
                            <span className="font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-gray-800 space-y-2">
                <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-gray-800 hover:text-white transition-all duration-200">
                    <FontAwesomeIcon icon={faCog} className="w-5 h-5 text-gray-500" />
                    <span className="font-medium">Ayarlar</span>
                </button>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-200"
                >
                    <FontAwesomeIcon icon={faSignOutAlt} className="w-5 h-5" />
                    <span className="font-medium">Çıkış Yap</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
