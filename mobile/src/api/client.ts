/**
 * API Client for Strapi Backend
 * Multi-tenant aware with x-tenant-id header
 */

import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = process.env.EXPO_PUBLIC_STRAPI_URL || 'http://localhost:1337';

// Token storage keys
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const TENANT_KEY = 'tenant_slug';

interface TokenResponse {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    user: {
        id: number;
        email: string;
        role: string;
        tenant: string;
    };
}

class ApiClient {
    private tenantSlug: string = 'arkadas';
    private accessToken: string | null = null;
    private refreshToken: string | null = null;

    constructor() {
        this.loadStoredTokens();
    }

    private async loadStoredTokens() {
        try {
            this.accessToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
            this.refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
            this.tenantSlug = (await SecureStore.getItemAsync(TENANT_KEY)) || 'arkadas';
        } catch (error) {
            console.error('Failed to load tokens:', error);
        }
    }

    private async saveTokens(access: string, refresh: string, tenant?: string) {
        this.accessToken = access;
        this.refreshToken = refresh;
        if (tenant) this.tenantSlug = tenant;

        await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, access);
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refresh);
        if (tenant) await SecureStore.setItemAsync(TENANT_KEY, tenant);
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
        const url = `${API_BASE_URL}${endpoint}`;

        const response = await fetch(url, {
            ...options,
            headers: {
                ...this.getHeaders(),
                ...options.headers,
            },
        });

        // Token expired - try refresh
        if (response.status === 401 && this.refreshToken) {
            const refreshed = await this.refreshAccessToken();
            if (refreshed) {
                // Retry with new token
                return this.fetch<T>(endpoint, options);
            }
        }

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || `HTTP ${response.status}`);
        }

        return response.json();
    }

    // Auth methods
    async login(identifier: string, password: string, deviceToken?: string): Promise<TokenResponse> {
        const response = await this.fetch<TokenResponse>('/api/auth/mobile/login', {
            method: 'POST',
            body: JSON.stringify({ identifier, password, deviceToken }),
        });

        await this.saveTokens(
            response.accessToken,
            response.refreshToken,
            response.user.tenant
        );

        return response;
    }

    async refreshAccessToken(): Promise<boolean> {
        if (!this.refreshToken) return false;

        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/mobile/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken: this.refreshToken }),
            });

            if (response.ok) {
                const data = await response.json();
                this.accessToken = data.accessToken;
                await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, data.accessToken);
                return true;
            }
        } catch (error) {
            console.error('Token refresh failed:', error);
        }

        // Clear tokens on refresh failure
        await this.logout();
        return false;
    }

    async logout(): Promise<void> {
        if (this.refreshToken) {
            try {
                await fetch(`${API_BASE_URL}/api/auth/mobile/logout`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refreshToken: this.refreshToken }),
                });
            } catch (e) {
                // Ignore logout errors - token may already be invalid
                console.debug('Logout request failed:', e);
            }
        }

        this.accessToken = null;
        this.refreshToken = null;
        await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
        await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    }

    // Check if user is authenticated
    isAuthenticated(): boolean {
        return !!this.accessToken;
    }

    // Set tenant
    setTenant(slug: string) {
        this.tenantSlug = slug;
        SecureStore.setItemAsync(TENANT_KEY, slug);
    }

    getTenant(): string {
        return this.tenantSlug;
    }
}

export const apiClient = new ApiClient();
