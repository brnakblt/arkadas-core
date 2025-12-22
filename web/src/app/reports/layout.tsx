'use client';

import Link from 'next/link';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export default function ReportsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Create QueryClient instance for this layout
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 60 * 1000,
                refetchOnWindowFocus: false,
            },
        },
    }));

    const reports = [
        { href: '/reports/attendance', label: 'Yoklama Raporu', icon: '📋' },
        { href: '/reports/progress', label: 'İlerleme Raporu', icon: '📈' },
        { href: '/reports/service', label: 'Servis İstatistikleri', icon: '🚐' },
    ];

    return (
        <QueryClientProvider client={queryClient}>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                {/* Sidebar */}
                <aside className="fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-800 border-r dark:border-gray-700 p-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                        📊 Raporlar
                    </h2>
                    <nav className="space-y-2">
                        {reports.map(report => (
                            <Link
                                key={report.href}
                                href={report.href}
                                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                <span className="text-2xl">{report.icon}</span>
                                <span className="text-gray-700 dark:text-gray-200">{report.label}</span>
                            </Link>
                        ))}
                    </nav>

                    <div className="absolute bottom-4 left-4 right-4">
                        <Link
                            href="/dashboard"
                            className="flex items-center gap-2 px-4 py-3 text-gray-500 hover:text-gray-700"
                        >
                            ← Dashboard&apos;a dön
                        </Link>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="ml-64">
                    {children}
                </main>
            </div>
        </QueryClientProvider>
    );
}
