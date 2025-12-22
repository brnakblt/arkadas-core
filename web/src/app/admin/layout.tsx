'use client';

/**
 * Admin Layout
 * Shared layout for all admin pages with sidebar navigation
 */

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// ============================================================
// Navigation Items
// ============================================================

const navItems = [
    {
        label: 'Dashboard',
        href: '/dashboard',
        icon: '📊',
    },
    {
        label: 'Kullanıcılar',
        href: '/admin/kullanicilar',
        icon: '👥',
    },
    {
        label: 'Roller & İzinler',
        href: '/admin/roller',
        icon: '🔐',
    },
    {
        label: 'Ayarlar',
        href: '/admin/ayarlar',
        icon: '⚙️',
    },
    {
        label: 'Loglar',
        href: '/admin/loglar',
        icon: '📋',
    },
];

// ============================================================
// Layout Component
// ============================================================

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
            {/* Sidebar */}
            <aside className="w-64 bg-gradient-to-b from-gray-900 to-gray-800 text-white flex-shrink-0 print:hidden">
                <div className="p-6">
                    <h1 className="text-xl font-bold flex items-center gap-2">
                        <span className="text-2xl">🛠️</span>
                        Admin Panel
                    </h1>
                </div>

                <nav className="px-4 pb-6">
                    <ul className="space-y-1">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                            return (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                                ? 'bg-blue-600 text-white'
                                                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                            }`}
                                    >
                                        <span className="text-lg">{item.icon}</span>
                                        <span className="font-medium">{item.label}</span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* Footer */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700">
                    <div className="text-xs text-gray-400 text-center">
                        Arkadaş ERP v1.0
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                {children}
            </main>
        </div>
    );
}
