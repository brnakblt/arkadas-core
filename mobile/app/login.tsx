import React, { useState, useEffect } from "react";
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Image,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

interface Tenant {
    id: number;
    name: string;
    domain: string;
}

export default function LoginScreen() {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [selectedTenantId, setSelectedTenantId] = useState<number | null>(null);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [tenantsLoading, setTenantsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        loadTenants();
        checkExistingAuth();
    }, []);

    const checkExistingAuth = async () => {
        try {
            const token = await AsyncStorage.getItem("authToken");
            if (token) {
                router.replace("/(tabs)");
            }
        } catch (err) {
            console.error("Auth check error:", err);
        }
    };

    const loadTenants = async () => {
        try {
            const response = await fetch(`${API_URL}/api/tenants`);
            const data = await response.json();
            setTenants(data.tenants || []);
            if (data.tenants?.length === 1) {
                setSelectedTenantId(data.tenants[0].id);
            }
        } catch (err) {
            console.error("Failed to load tenants:", err);
        } finally {
            setTenantsLoading(false);
        }
    };

    const handleLogin = async () => {
        if (!email || !password) {
            setError("E-posta ve şifre gereklidir");
            return;
        }

        if (tenants.length > 1 && !selectedTenantId) {
            setError("Lütfen bir kurum seçiniz");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            const response = await fetch(`${API_URL}/api/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    identifier: email,
                    password,
                    tenantId: selectedTenantId,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Giriş yapılamadı");
            }

            // Store auth data
            await AsyncStorage.setItem("authToken", data.jwt || "");
            await AsyncStorage.setItem("user", JSON.stringify(data.user));
            if (selectedTenantId) {
                await AsyncStorage.setItem("tenantId", String(selectedTenantId));
            }

            // Navigate to main app
            router.replace("/(tabs)");
        } catch (err) {
            console.error("Login error:", err);
            setError(err instanceof Error ? err.message : "Giriş yapılamadı");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.logoContainer}>
                    <View style={styles.logoPlaceholder}>
                        <Text style={styles.logoText}>🎓</Text>
                    </View>
                    <Text style={styles.title}>Arkadaş ERP</Text>
                    <Text style={styles.subtitle}>Özel Eğitim Yönetim Sistemi</Text>
                </View>

                <View style={styles.formContainer}>
                    {error ? (
                        <View style={styles.errorContainer}>
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    ) : null}

                    {/* Tenant Selection */}
                    {tenants.length > 1 && (
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Kurum Seçimi</Text>
                            <View style={styles.pickerContainer}>
                                <Picker
                                    selectedValue={selectedTenantId}
                                    onValueChange={(value: number | null) => setSelectedTenantId(value)}
                                    style={styles.picker}
                                >
                                    <Picker.Item label="Kurum seçiniz..." value={null} />
                                    {tenants.map((tenant) => (
                                        <Picker.Item
                                            key={tenant.id}
                                            label={tenant.name}
                                            value={tenant.id}
                                        />
                                    ))}
                                </Picker>
                            </View>
                        </View>
                    )}

                    {/* Email Input */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>E-posta</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="ornek@email.com"
                            placeholderTextColor="#9ca3af"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                    </View>

                    {/* Password Input */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Şifre</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="••••••••"
                            placeholderTextColor="#9ca3af"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                    </View>

                    {/* Login Button */}
                    <TouchableOpacity
                        style={[
                            styles.loginButton,
                            (isLoading || tenantsLoading) && styles.loginButtonDisabled,
                        ]}
                        onPress={handleLogin}
                        disabled={isLoading || tenantsLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.loginButtonText}>Giriş Yap</Text>
                        )}
                    </TouchableOpacity>

                    {/* Forgot Password */}
                    <TouchableOpacity style={styles.forgotPassword}>
                        <Text style={styles.forgotPasswordText}>Şifremi Unuttum?</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f8fafc",
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: "center",
        padding: 24,
    },
    logoContainer: {
        alignItems: "center",
        marginBottom: 40,
    },
    logoPlaceholder: {
        width: 80,
        height: 80,
        borderRadius: 20,
        backgroundColor: "#3b82f6",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 16,
    },
    logoText: {
        fontSize: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#1f2937",
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 16,
        color: "#6b7280",
    },
    formContainer: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    errorContainer: {
        backgroundColor: "#fef2f2",
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
    },
    errorText: {
        color: "#dc2626",
        fontSize: 14,
    },
    inputContainer: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        color: "#374151",
        marginBottom: 8,
    },
    input: {
        backgroundColor: "#f9fafb",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: "#1f2937",
    },
    pickerContainer: {
        backgroundColor: "#f9fafb",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 12,
        overflow: "hidden",
    },
    picker: {
        height: 50,
    },
    loginButton: {
        backgroundColor: "#3b82f6",
        borderRadius: 12,
        padding: 16,
        alignItems: "center",
        marginTop: 8,
    },
    loginButtonDisabled: {
        opacity: 0.7,
    },
    loginButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
    forgotPassword: {
        alignItems: "center",
        marginTop: 16,
    },
    forgotPasswordText: {
        color: "#3b82f6",
        fontSize: 14,
        fontWeight: "500",
    },
});
