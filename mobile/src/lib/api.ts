/**
 * API Client for Strapi Backend
 * Multi-tenant aware with x-tenant-id header and JWT refresh
 */

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:1337';

// Storage keys
const KEYS = {
    ACCESS_TOKEN: 'arkadas_access_token',
    REFRESH_TOKEN: 'arkadas_refresh_token',
    TENANT_SLUG: 'arkadas_tenant_slug',
    USER: 'arkadas_user',
} as const;

// Helper to abstract storage across Web (localStorage) and Native (SecureStore)
const Storage = {
    getItem: async (key: string): Promise<string | null> => {
        if (Platform.OS === 'web') {
            if (typeof localStorage !== 'undefined') {
                return localStorage.getItem(key);
            }
            return null;
        }
        return SecureStore.getItemAsync(key);
    },
    setItem: async (key: string, value: string): Promise<void> => {
        if (Platform.OS === 'web') {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem(key, value);
            }
            return;
        }
        return SecureStore.setItemAsync(key, value);
    },
    deleteItem: async (key: string): Promise<void> => {
        if (Platform.OS === 'web') {
            if (typeof localStorage !== 'undefined') {
                localStorage.removeItem(key);
            }
            return;
        }
        return SecureStore.deleteItemAsync(key);
    }
};

export interface User {
    id: number;
    email: string;
    username: string;
    role: 'teacher' | 'parent' | 'admin';
    tenant: {
        id: number;
        slug: string;
        name: string;
    };
}

export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    user: User;
}

class ApiClient {
    private accessToken: string | null = null;
    private refreshToken: string | null = null;
    private tenantSlug: string = 'arkadas';
    private user: User | null = null;
    private initialized = false;

    async init(): Promise<void> {
        if (this.initialized) return;

        try {
            this.accessToken = await Storage.getItem(KEYS.ACCESS_TOKEN);
            this.refreshToken = await Storage.getItem(KEYS.REFRESH_TOKEN);
            this.tenantSlug = (await Storage.getItem(KEYS.TENANT_SLUG)) || 'arkadas';

            const userJson = await Storage.getItem(KEYS.USER);
            if (userJson) {
                this.user = JSON.parse(userJson);
            }
        } catch (error) {
            console.error('[API] Failed to load stored credentials:', error);
        }

        this.initialized = true;
    }

    private getHeaders(): HeadersInit {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            'x-tenant-id': this.tenantSlug,
        };

        if (this.accessToken) {
            headers['Authorization'] = `Bearer ${this.accessToken}`;
        }

        return headers;
    }

    async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        await this.init();

        const url = `${API_URL}${endpoint}`;

        const response = await fetch(url, {
            ...options,
            headers: {
                ...this.getHeaders(),
                ...options.headers,
            },
        });

        // Token expired - try refresh
        if (response.status === 401 && this.refreshToken) {
            const refreshed = await this.tryRefreshToken();
            if (refreshed) {
                return this.fetch<T>(endpoint, options);
            }
        }

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
            throw new Error(error.message || error.error?.message || `HTTP ${response.status}`);
        }

        return response.json();
    }

    // Auth methods
    async login(identifier: string, password: string): Promise<AuthResponse> {
        const response = await this.fetch<AuthResponse>('/api/auth/mobile/login', {
            method: 'POST',
            body: JSON.stringify({ identifier, password }),
        });

        await this.saveCredentials(response);
        return response;
    }

    private async tryRefreshToken(): Promise<boolean> {
        if (!this.refreshToken) return false;

        try {
            const response = await fetch(`${API_URL}/api/auth/mobile/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken: this.refreshToken }),
            });

            if (response.ok) {
                const data = await response.json();
                this.accessToken = data.accessToken;
                await Storage.setItem(KEYS.ACCESS_TOKEN, data.accessToken);
                return true;
            }
        } catch (error) {
            console.error('[API] Token refresh failed:', error);
        }

        // Refresh failed - logout
        await this.logout();
        return false;
    }

    private async saveCredentials(response: AuthResponse): Promise<void> {
        this.accessToken = response.accessToken;
        this.refreshToken = response.refreshToken;
        this.user = response.user;
        this.tenantSlug = response.user.tenant.slug;

        await Storage.setItem(KEYS.ACCESS_TOKEN, response.accessToken);
        await Storage.setItem(KEYS.REFRESH_TOKEN, response.refreshToken);
        await Storage.setItem(KEYS.TENANT_SLUG, response.user.tenant.slug);
        await Storage.setItem(KEYS.USER, JSON.stringify(response.user));
    }

    async logout(): Promise<void> {
        // Revoke refresh token on server
        if (this.refreshToken) {
            try {
                await fetch(`${API_URL}/api/auth/mobile/logout`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refreshToken: this.refreshToken }),
                });
            } catch {
                // Ignore - token may already be invalid
            }
        }

        this.accessToken = null;
        this.refreshToken = null;
        this.user = null;

        await Storage.deleteItem(KEYS.ACCESS_TOKEN);
        await Storage.deleteItem(KEYS.REFRESH_TOKEN);
        await Storage.deleteItem(KEYS.USER);
    }

    isAuthenticated(): boolean {
        return !!this.accessToken;
    }

    getUser(): User | null {
        return this.user;
    }

    getTenantSlug(): string {
        return this.tenantSlug;
    }
}

export const api = new ApiClient();