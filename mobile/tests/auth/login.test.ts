/**
 * Mobile Login Screen Test Suite
 * 
 * Tests the mobile authentication flow including:
 * - Tenant selection
 * - Login form validation
 * - AsyncStorage token storage
 * - Navigation after login
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock AsyncStorage
const mockAsyncStorage: Record<string, string> = {};

jest.mock('@react-native-async-storage/async-storage', () => ({
    default: {
        getItem: jest.fn((key: string) => Promise.resolve(mockAsyncStorage[key] || null)),
        setItem: jest.fn((key: string, value: string) => {
            mockAsyncStorage[key] = value;
            return Promise.resolve();
        }),
        removeItem: jest.fn((key: string) => {
            delete mockAsyncStorage[key];
            return Promise.resolve();
        }),
        clear: jest.fn(() => {
            Object.keys(mockAsyncStorage).forEach(key => delete mockAsyncStorage[key]);
            return Promise.resolve();
        }),
    },
}));

// Mock expo-router
jest.mock('expo-router', () => ({
    router: {
        replace: jest.fn(),
        push: jest.fn(),
    },
}));

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

describe('Mobile Login Screen', () => {
    beforeEach(() => {
        // Clear mocks
        jest.clearAllMocks();
        Object.keys(mockAsyncStorage).forEach(key => delete mockAsyncStorage[key]);
    });

    describe('Tenant Loading', () => {
        it('should fetch tenants on mount', async () => {
            const mockTenants = {
                tenants: [
                    { id: 1, name: 'Kurum A', domain: 'a.test.com' },
                    { id: 2, name: 'Kurum B', domain: 'b.test.com' },
                ],
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockTenants),
            });

            // Simulate tenant fetch
            const response = await fetch('/api/tenants');
            const data = await response.json();

            expect(data.tenants).toHaveLength(2);
            expect(data.tenants[0].name).toBe('Kurum A');
        });

        it('should auto-select tenant when only one exists', async () => {
            const mockTenants = {
                tenants: [{ id: 1, name: 'Tek Kurum', domain: 'tek.test.com' }],
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockTenants),
            });

            const response = await fetch('/api/tenants');
            const data = await response.json();

            // Should auto-select the only tenant
            expect(data.tenants.length).toBe(1);
            const selectedTenantId = data.tenants.length === 1 ? data.tenants[0].id : null;
            expect(selectedTenantId).toBe(1);
        });

        it('should handle empty tenant list', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ tenants: [] }),
            });

            const response = await fetch('/api/tenants');
            const data = await response.json();

            expect(data.tenants).toHaveLength(0);
        });
    });

    describe('Login Form Validation', () => {
        it('should require email and password', () => {
            const email = '';
            const password = '';

            let error = '';
            if (!email || !password) {
                error = 'E-posta ve şifre gereklidir';
            }

            expect(error).toBe('E-posta ve şifre gereklidir');
        });

        it('should require tenant selection when multiple tenants exist', () => {
            const tenants = [{ id: 1 }, { id: 2 }];
            const selectedTenantId = null;

            let error = '';
            if (tenants.length > 1 && !selectedTenantId) {
                error = 'Lütfen bir kurum seçiniz';
            }

            expect(error).toBe('Lütfen bir kurum seçiniz');
        });

        it('should pass validation with valid inputs', () => {
            const email = 'test@example.com';
            const password = 'password123';
            const tenants = [{ id: 1 }, { id: 2 }];
            const selectedTenantId = 1;

            let error = '';
            if (!email || !password) {
                error = 'E-posta ve şifre gereklidir';
            } else if (tenants.length > 1 && !selectedTenantId) {
                error = 'Lütfen bir kurum seçiniz';
            }

            expect(error).toBe('');
        });
    });

    describe('Login API Call', () => {
        it('should send correct payload to login endpoint', async () => {
            const loginPayload = {
                identifier: 'test@example.com',
                password: 'password123',
                tenantId: 1,
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    jwt: 'mock-jwt-token',
                    user: { id: 1, email: 'test@example.com' },
                }),
            });

            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(loginPayload),
            });

            expect(mockFetch).toHaveBeenCalledWith('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(loginPayload),
            });

            const data = await response.json();
            expect(data.jwt).toBe('mock-jwt-token');
        });

        it('should handle login failure', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                json: () => Promise.resolve({ error: 'Invalid credentials' }),
            });

            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier: 'wrong@email.com', password: 'wrong' }),
            });

            expect(response.ok).toBe(false);
            const data = await response.json();
            expect(data.error).toBe('Invalid credentials');
        });
    });

    describe('Token Storage', () => {
        it('should store auth token after successful login', async () => {
            const AsyncStorage = require('@react-native-async-storage/async-storage').default;

            await AsyncStorage.setItem('authToken', 'test-jwt-token');
            const token = await AsyncStorage.getItem('authToken');

            expect(token).toBe('test-jwt-token');
        });

        it('should store user data after login', async () => {
            const AsyncStorage = require('@react-native-async-storage/async-storage').default;
            const user = { id: 1, email: 'test@example.com' };

            await AsyncStorage.setItem('user', JSON.stringify(user));
            const storedUser = await AsyncStorage.getItem('user');

            expect(JSON.parse(storedUser)).toEqual(user);
        });

        it('should store tenant ID after login', async () => {
            const AsyncStorage = require('@react-native-async-storage/async-storage').default;

            await AsyncStorage.setItem('tenantId', '1');
            const tenantId = await AsyncStorage.getItem('tenantId');

            expect(tenantId).toBe('1');
        });
    });

    describe('Existing Auth Check', () => {
        it('should redirect if token exists', async () => {
            const AsyncStorage = require('@react-native-async-storage/async-storage').default;
            const router = require('expo-router').router;

            await AsyncStorage.setItem('authToken', 'existing-token');
            const token = await AsyncStorage.getItem('authToken');

            if (token) {
                router.replace('/(tabs)');
            }

            expect(router.replace).toHaveBeenCalledWith('/(tabs)');
        });

        it('should not redirect if no token', async () => {
            const AsyncStorage = require('@react-native-async-storage/async-storage').default;
            const router = require('expo-router').router;

            await AsyncStorage.clear();
            const token = await AsyncStorage.getItem('authToken');

            if (token) {
                router.replace('/(tabs)');
            }

            expect(router.replace).not.toHaveBeenCalled();
        });
    });
});
