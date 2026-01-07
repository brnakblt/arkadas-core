"use client";

import React from 'react';
import Sidebar from '@/components/dashboard/Sidebar';
import TopBar from '@/components/dashboard/TopBar';
import { DashboardProvider } from '@/context/DashboardContext';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <DashboardProvider>
            <div className="flex min-h-screen bg-[#f5f5f5]">
                <Sidebar />
                <div className="flex-1 flex flex-col ml-64 transition-all duration-300">
                    <TopBar />
                    <main id="main-content" className="flex-1 p-6 overflow-y-auto">
                        {children}
                    </main>
                </div>
            </div>
        </DashboardProvider>
    );
}

