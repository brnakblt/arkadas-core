/**
 * Auth Store using Zustand
 */

import { create } from 'zustand';
import { apiClient } from '../api/client';

interface User {
    id: number;
    email: string;
    role: string;
    tenant: string;
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;

    login: (identifier: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isAuthenticated: false,
    isLoading: true,

    login: async (identifier, password) => {
        set({ isLoading: true });
        try {
            const response = await apiClient.login(identifier, password);
            set({
                user: response.user,
                isAuthenticated: true,
                isLoading: false,
            });
        } catch (error) {
            set({ isLoading: false });
            throw error;
        }
    },

    logout: async () => {
        await apiClient.logout();
        set({ user: null, isAuthenticated: false });
    },

    checkAuth: async () => {
        set({ isLoading: true });
        const isAuth = apiClient.isAuthenticated();

        if (isAuth) {
            try {
                const response = await apiClient.fetch<{
                    id: number;
                    email: string;
                    role: string;
                    tenant: { slug: string }
                }>('/api/auth/mobile/me');

                set({
                    user: {
                        id: response.id,
                        email: response.email,
                        role: response.role,
                        tenant: response.tenant?.slug || 'arkadas',
                    },
                    isAuthenticated: true,
                    isLoading: false,
                });
            } catch {
                set({ isAuthenticated: false, isLoading: false });
            }
        } else {
            set({ isAuthenticated: false, isLoading: false });
        }
    },
}));
