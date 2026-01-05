"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/authService';

interface User {
    id: number;
    username: string;
    email: string;
    userType?: 'parent' | 'teacher';
    role?: {
        id: number;
        name: string;
        type: string;
    };
}

interface DashboardContextType {
    user: User | null;
    loading: boolean;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
}

const DashboardContext = createContext<DashboardContextType>({
    user: null,
    loading: true,
    searchQuery: '',
    setSearchQuery: () => { }
});

export const useDashboard = () => useContext(DashboardContext);

export const DashboardProvider = ({ children }: { children: React.ReactNode }) => {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchUser = async () => {
            try {
                // authService.getMe() cookies via /api/auth/me proxy
                const userData = await authService.getMe();
                setUser(userData);
            } catch (error) {
                console.error("Error fetching user data:", error);
                router.push('/');
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [router]);

    if (loading && !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <DashboardContext.Provider value={{ user, loading, searchQuery, setSearchQuery }}>
            {children}
        </DashboardContext.Provider>
    );
};
