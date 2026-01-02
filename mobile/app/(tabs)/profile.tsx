/**
 * Profile Screen
 */

import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../src/stores';

export default function ProfileScreen() {
    const { user, logout } = useAuthStore();

    const handleLogout = () => {
        Alert.alert(
            'Çıkış',
            'Çıkış yapmak istediğinize emin misiniz?',
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Çıkış Yap',
                    style: 'destructive',
                    onPress: async () => {
                        await logout();
                        router.replace('/(auth)/login');
                    },
                },
            ]
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {user?.email?.charAt(0).toUpperCase() || '?'}
                    </Text>
                </View>
                <Text style={styles.email}>{user?.email}</Text>
                <Text style={styles.role}>{user?.role}</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Kurum Bilgileri</Text>
                <View style={styles.infoRow}>
                    <Text style={styles.label}>Tenant</Text>
                    <Text style={styles.value}>{user?.tenant}</Text>
                </View>
            </View>

            <View style={styles.actions}>
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Text style={styles.logoutText}>Çıkış Yap</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.version}>Versiyon 1.0.0</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        backgroundColor: '#2563eb',
        alignItems: 'center',
        paddingVertical: 30,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    avatarText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#2563eb',
    },
    email: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
    },
    role: {
        color: '#fff',
        opacity: 0.8,
        marginTop: 4,
    },
    section: {
        backgroundColor: '#fff',
        margin: 12,
        padding: 16,
        borderRadius: 12,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#999',
        marginBottom: 12,
        textTransform: 'uppercase',
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
    },
    label: {
        color: '#666',
    },
    value: {
        fontWeight: '500',
        color: '#333',
    },
    actions: {
        padding: 12,
    },
    logoutButton: {
        backgroundColor: '#dc2626',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    logoutText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    version: {
        textAlign: 'center',
        color: '#999',
        marginTop: 20,
    },
});
