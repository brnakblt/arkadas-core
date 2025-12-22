import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { useState, useEffect, useCallback } from 'react';

// ============================================================
// Types
// ============================================================

type BiometricType = 'fingerprint' | 'facial' | 'iris' | 'none';

interface BiometricStatus {
    isAvailable: boolean;
    isEnrolled: boolean;
    biometricType: BiometricType;
    securityLevel: 'weak' | 'strong';
}

interface AuthResult {
    success: boolean;
    error?: string;
}

// ============================================================
// Secure Storage Keys
// ============================================================

const SECURE_KEYS = {
    BIOMETRIC_ENABLED: 'biometric_enabled',
    USER_TOKEN: 'user_token',
    USER_PIN: 'user_pin',
};

// ============================================================
// Biometric Authentication Hook
// ============================================================

/**
 * Hook for biometric authentication
 */
export function useBiometricAuth() {
    const [status, setStatus] = useState<BiometricStatus>({
        isAvailable: false,
        isEnrolled: false,
        biometricType: 'none',
        securityLevel: 'weak',
    });
    const [isEnabled, setIsEnabled] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Check biometric availability
    useEffect(() => {
        checkBiometricStatus();
        checkIfEnabled();
    }, []);

    const checkBiometricStatus = async () => {
        try {
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            const isEnrolled = await LocalAuthentication.isEnrolledAsync();
            const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
            const securityLevel = await LocalAuthentication.getEnrolledLevelAsync();

            let biometricType: BiometricType = 'none';
            if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
                biometricType = 'facial';
            } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
                biometricType = 'fingerprint';
            } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
                biometricType = 'iris';
            }

            setStatus({
                isAvailable: hasHardware,
                isEnrolled,
                biometricType,
                securityLevel: securityLevel === LocalAuthentication.SecurityLevel.BIOMETRIC_STRONG
                    ? 'strong'
                    : 'weak',
            });
        } catch (error) {
            console.error('Biometric check error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const checkIfEnabled = async () => {
        try {
            const enabled = await SecureStore.getItemAsync(SECURE_KEYS.BIOMETRIC_ENABLED);
            setIsEnabled(enabled === 'true');
        } catch {
            setIsEnabled(false);
        }
    };

    // Authenticate with biometrics
    const authenticate = useCallback(async (reason?: string): Promise<AuthResult> => {
        if (!status.isAvailable || !status.isEnrolled) {
            return { success: false, error: 'Biyometrik doğrulama kullanılamıyor' };
        }

        try {
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: reason || 'Kimliğinizi doğrulayın',
                cancelLabel: 'İptal',
                disableDeviceFallback: false,
                fallbackLabel: 'PIN kullan',
            });

            if (result.success) {
                return { success: true };
            } else {
                return {
                    success: false,
                    error: result.error === 'user_cancel'
                        ? 'Kullanıcı iptal etti'
                        : 'Doğrulama başarısız',
                };
            }
        } catch (error) {
            return { success: false, error: 'Beklenmeyen hata oluştu' };
        }
    }, [status]);

    // Enable biometric auth
    const enableBiometric = useCallback(async (): Promise<AuthResult> => {
        const authResult = await authenticate('Biyometrik doğrulamayı etkinleştir');

        if (authResult.success) {
            await SecureStore.setItemAsync(SECURE_KEYS.BIOMETRIC_ENABLED, 'true');
            setIsEnabled(true);
            return { success: true };
        }

        return authResult;
    }, [authenticate]);

    // Disable biometric auth
    const disableBiometric = useCallback(async (): Promise<void> => {
        await SecureStore.deleteItemAsync(SECURE_KEYS.BIOMETRIC_ENABLED);
        setIsEnabled(false);
    }, []);

    return {
        status,
        isEnabled,
        isLoading,
        authenticate,
        enableBiometric,
        disableBiometric,
    };
}

// ============================================================
// Secure Token Storage
// ============================================================

export const secureStorage = {
    // Save auth token securely
    async saveToken(token: string): Promise<void> {
        await SecureStore.setItemAsync(SECURE_KEYS.USER_TOKEN, token);
    },

    // Get auth token
    async getToken(): Promise<string | null> {
        return await SecureStore.getItemAsync(SECURE_KEYS.USER_TOKEN);
    },

    // Remove auth token
    async removeToken(): Promise<void> {
        await SecureStore.deleteItemAsync(SECURE_KEYS.USER_TOKEN);
    },

    // Save PIN
    async savePIN(pin: string): Promise<void> {
        await SecureStore.setItemAsync(SECURE_KEYS.USER_PIN, pin);
    },

    // Verify PIN
    async verifyPIN(pin: string): Promise<boolean> {
        const savedPin = await SecureStore.getItemAsync(SECURE_KEYS.USER_PIN);
        return savedPin === pin;
    },

    // Has PIN
    async hasPIN(): Promise<boolean> {
        const pin = await SecureStore.getItemAsync(SECURE_KEYS.USER_PIN);
        return !!pin;
    },
};

// ============================================================
// Biometric Settings Component Helper
// ============================================================

/**
 * Get biometric icon and label
 */
export function getBiometricInfo(type: BiometricType): { icon: string; label: string } {
    switch (type) {
        case 'fingerprint':
            return { icon: '👆', label: 'Parmak İzi' };
        case 'facial':
            return { icon: '👤', label: 'Face ID' };
        case 'iris':
            return { icon: '👁️', label: 'Iris Tarama' };
        default:
            return { icon: '🔒', label: 'Biyometrik' };
    }
}
