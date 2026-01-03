/**
 * Auth Store - Zustand state management for authentication
 */

import { create } from 'zustand';
import * as LocalAuthentication from 'expo-local-authentication';
import { api, User, AuthResponse } from '@/lib/api';

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    biometricAvailable: boolean;
    biometricType: 'fingerprint' | 'face' | 'iris' | null;

    // Actions
    init: () => Promise<void>;
    login: (identifier: string, password: string) => Promise<AuthResponse>;
    loginWithBiometric: () => Promise<boolean>;
    logout: () => Promise<void>;
    checkBiometricSupport: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    biometricAvailable: false,
    biometricType: null,

    init: async () => {
        set({ isLoading: true });

        try {
            await api.init();
            const user = api.getUser();

            set({
                user,
                isAuthenticated: api.isAuthenticated(),
                isLoading: false,
            });

            // Check biometric in background
            get().checkBiometricSupport();
        } catch (error) {
            console.error('[Auth] Init failed:', error);
            set({ isLoading: false });
        }
    },

    login: async (identifier, password) => {
        set({ isLoading: true });

        try {
            const response = await api.login(identifier, password);

            set({
                user: response.user,
                isAuthenticated: true,
                isLoading: false,
            });

            return response;
        } catch (error) {
            set({ isLoading: false });
            throw error;
        }
    },

    loginWithBiometric: async () => {
        const { biometricAvailable } = get();

        if (!biometricAvailable) {
            return false;
        }

        try {
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Giriş yapmak için doğrulayın',
                cancelLabel: 'İptal',
                disableDeviceFallback: false,
            });

            if (result.success) {
                // Re-init to check if we have stored credentials
                await api.init();
                const user = api.getUser();

                if (user && api.isAuthenticated()) {
                    set({
                        user,
                        isAuthenticated: true,
                    });
                    return true;
                }
            }

            return false;
        } catch (error) {
            console.error('[Auth] Biometric auth failed:', error);
            return false;
        }
    },

    logout: async () => {
        await api.logout();
        set({
            user: null,
            isAuthenticated: false,
        });
    },

    checkBiometricSupport: async () => {
        try {
            const compatible = await LocalAuthentication.hasHardwareAsync();
            const enrolled = await LocalAuthentication.isEnrolledAsync();
            const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

            let biometricType: 'fingerprint' | 'face' | 'iris' | null = null;

            if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
                biometricType = 'face';
            } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
                biometricType = 'fingerprint';
            } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
                biometricType = 'iris';
            }

            set({
                biometricAvailable: compatible && enrolled,
                biometricType,
            });
        } catch (error) {
            console.error('[Auth] Biometric check failed:', error);
        }
    },
}));
