/**
 * Login Screen with Biometric Support
 */

import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert,
    Image,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '@/stores/auth';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const login = useAuthStore((state) => state.login);
    const loginWithBiometric = useAuthStore((state) => state.loginWithBiometric);
    const biometricAvailable = useAuthStore((state) => state.biometricAvailable);
    const biometricType = useAuthStore((state) => state.biometricType);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

    // Try biometric on mount if available and user has logged in before
    useEffect(() => {
        if (biometricAvailable && !isAuthenticated) {
            handleBiometricLogin();
        }
    }, [biometricAvailable]);

    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) {
            Alert.alert('Hata', 'E-posta ve şifre gereklidir');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
        }

        setLoading(true);
        try {
            await login(email.trim(), password);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.replace('/(tabs)');
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Giriş yapılamadı';
            Alert.alert('Giriş Hatası', message);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } finally {
            setLoading(false);
        }
    };

    const handleBiometricLogin = async () => {
        const success = await loginWithBiometric();
        if (success) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.replace('/(tabs)');
        }
    };

    const getBiometricLabel = () => {
        switch (biometricType) {
            case 'face':
                return 'Face ID ile Giriş';
            case 'fingerprint':
                return 'Parmak İzi ile Giriş';
            default:
                return 'Biyometrik ile Giriş';
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            {/* Logo */}
            <View style={styles.header}>
                <View style={styles.logoContainer}>
                    <Text style={styles.logoEmoji}>🎓</Text>
                </View>
                <Text style={styles.title}>Arkadaş Özel Eğitim</Text>
                <Text style={styles.subtitle}>Yönetim Sistemi</Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>E-posta</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="ornek@arkadas.com.tr"
                        placeholderTextColor="#94a3b8"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                        autoCorrect={false}
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Şifre</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="••••••••"
                        placeholderTextColor="#94a3b8"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        autoComplete="password"
                    />
                </View>

                <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleLogin}
                    disabled={loading}
                    activeOpacity={0.8}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>Giriş Yap</Text>
                    )}
                </TouchableOpacity>

                {/* Biometric Login */}
                {biometricAvailable && (
                    <TouchableOpacity
                        style={styles.biometricButton}
                        onPress={handleBiometricLogin}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.biometricIcon}>
                            {biometricType === 'face' ? '👤' : '👆'}
                        </Text>
                        <Text style={styles.biometricText}>{getBiometricLabel()}</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Footer */}
            <Text style={styles.footer}>© 2024 Arkadaş Özel Eğitim</Text>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
        paddingHorizontal: 24,
    },
    header: {
        alignItems: 'center',
        marginTop: 80,
        marginBottom: 48,
    },
    logoContainer: {
        width: 80,
        height: 80,
        borderRadius: 20,
        backgroundColor: '#2563eb',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#2563eb',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    logoEmoji: {
        fontSize: 40,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1e293b',
    },
    subtitle: {
        fontSize: 16,
        color: '#64748b',
        marginTop: 4,
    },
    form: {
        gap: 16,
    },
    inputContainer: {
        gap: 6,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#475569',
        marginLeft: 4,
    },
    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: '#1e293b',
    },
    button: {
        backgroundColor: '#2563eb',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 8,
        shadowColor: '#2563eb',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '600',
    },
    biometricButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 8,
    },
    biometricIcon: {
        fontSize: 24,
    },
    biometricText: {
        fontSize: 16,
        color: '#2563eb',
        fontWeight: '500',
    },
    footer: {
        position: 'absolute',
        bottom: 32,
        left: 0,
        right: 0,
        textAlign: 'center',
        color: '#94a3b8',
        fontSize: 13,
    },
});
