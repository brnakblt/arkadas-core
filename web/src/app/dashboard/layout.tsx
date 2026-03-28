import React from 'react';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import { Menu } from 'lucide-react';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-slate-50 relative flex font-sans">
            {/* Desktop Sidebar */}
            <DashboardSidebar />

            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 w-full bg-white border-b p-4 z-20 flex justify-between items-center shadow-sm">
                <h1 className="font-bold text-primary">Arkadaş ERP</h1>
                {/* Mobile menu trigger would go here - handled in client component usually or via sheet */}
                <button className="p-2 text-primary hover:bg-primary/5 rounded-lg transition-colors"><Menu size={24} /></button>
            </div>

            <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
                <main className="flex-1 p-4 md:p-8 pt-20 md:pt-8 animate-fade-in overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
