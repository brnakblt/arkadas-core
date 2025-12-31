'use client';

import Link from 'next/link';
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/free-mode';

interface QuickLink {
    icon: string;
    label: string;
    href: string;
    color: string;
    description?: string;
}

const QUICK_LINKS: QuickLink[] = [
    {
        icon: '🚌',
        label: 'Servis Takip',
        href: '/servis-takip',
        color: 'from-blue-500 to-cyan-400',
        description: 'Gerçek zamanlı servis konumu',
    },
    {
        icon: '📋',
        label: 'Yoklama',
        href: '/yoklama',
        color: 'from-green-500 to-emerald-400',
        description: 'Günlük yoklama takibi',
    },
    {
        icon: '📅',
        label: 'Program',
        href: '/program',
        color: 'from-purple-500 to-pink-400',
        description: 'Haftalık eğitim programı',
    },
    {
        icon: '📞',
        label: 'İletişim',
        href: '/iletisim',
        color: 'from-orange-500 to-red-400',
        description: 'Bizimle iletişime geçin',
    },
    {
        icon: '📁',
        label: 'Dosyalar',
        href: '/dosyalar',
        color: 'from-indigo-500 to-blue-400',
        description: 'SFTPGo dosya yönetimi',
    },
    {
        icon: '👤',
        label: 'Profilim',
        href: '/profil',
        color: 'from-teal-500 to-green-400',
        description: 'Hesap ayarları',
    },
];

interface QuickLinksProps {
    variant?: 'grid' | 'horizontal' | 'compact';
    showDescriptions?: boolean;
    maxItems?: number;
}

export default function QuickLinks({
    variant = 'grid',
    showDescriptions = true,
    maxItems = 6,
}: QuickLinksProps) {
    const links = QUICK_LINKS.slice(0, maxItems);

    if (variant === 'horizontal') {
        return (
            <div className="w-full">
                <Swiper
                    slidesPerView="auto"
                    spaceBetween={12}
                    freeMode={true}
                    modules={[FreeMode]}
                    className="!pb-4 px-1"
                >
                    {links.map((link) => (
                        <SwiperSlide key={link.label} className="!w-auto">
                            <Link
                                href={link.href}
                                className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl shadow-sm border hover:shadow-md transition-all whitespace-nowrap group select-none"
                                draggable={false}
                            >
                                <span className={`w-10 h-10 rounded-lg bg-gradient-to-br ${link.color} flex items-center justify-center text-lg group-hover:scale-110 transition-transform`}>
                                    {link.icon}
                                </span>
                                <span className="font-medium text-gray-700">{link.label}</span>
                            </Link>
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>
        );
    }

    if (variant === 'compact') {
        return (
            <div className="flex flex-wrap gap-2">
                {links.map((link) => (
                    <Link
                        key={link.label}
                        href={link.href}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${link.color} text-white font-medium hover:shadow-lg transition-all hover:scale-105`}
                    >
                        <span>{link.icon}</span>
                        <span>{link.label}</span>
                    </Link>
                ))}
            </div>
        );
    }

    // Grid variant (default)
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {links.map((link) => (
                <Link
                    key={link.label}
                    href={link.href}
                    className="group"
                >
                    <div className="bg-white rounded-2xl p-5 shadow-sm border hover:shadow-lg transition-all hover:-translate-y-1">
                        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${link.color} flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                            {link.icon}
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-1">{link.label}</h3>
                        {showDescriptions && link.description && (
                            <p className="text-sm text-gray-500">{link.description}</p>
                        )}
                    </div>
                </Link>
            ))}
        </div>
    );
}

// Floating Quick Access Button
export function QuickAccessButton() {
    return (
        <div className="fixed bottom-6 right-6 z-50">
            <div className="relative group">
                {/* Trigger Button */}
                <button className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full shadow-lg flex items-center justify-center text-white text-2xl hover:scale-110 transition-transform">
                    ⚡
                </button>

                {/* Quick Links Popup */}
                <div className="absolute bottom-16 right-0 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300">
                    <div className="bg-white rounded-2xl shadow-2xl p-4 w-64">
                        <h4 className="font-semibold text-gray-900 mb-3 px-2">Hızlı Erişim</h4>
                        <div className="space-y-2">
                            {QUICK_LINKS.slice(0, 4).map((link) => (
                                <Link
                                    key={link.label}
                                    href={link.href}
                                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <span className={`w-8 h-8 rounded-lg bg-gradient-to-br ${link.color} flex items-center justify-center text-sm`}>
                                        {link.icon}
                                    </span>
                                    <span className="text-gray-700 font-medium">{link.label}</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
