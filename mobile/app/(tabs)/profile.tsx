/**
 * Profile Screen - User info and settings
 */

import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '@/stores/auth';
import { getShadowStyle } from '@/utils/styles';

export default function ProfileScreen() {
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);

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
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        router.replace('/(auth)/login');
                    },
                },
            ]
        );
    };

    const getRoleLabel = () => {
        switch (user?.role) {
            case 'teacher':
                return 'Öğretmen';
            case 'parent':
                return 'Veli';
            case 'admin':
                return 'Yönetici';
            default:
                return '';
        }
    };

    const menuItems = [
        { id: 'notifications', icon: '🔔', label: 'Bildirimler', badge: '3' },
        { id: 'messages', icon: '💬', label: 'Mesajlar', badge: '2' },
        { id: 'documents', icon: '📄', label: 'Belgelerim' },
        { id: 'settings', icon: '⚙️', label: 'Ayarlar' },
        { id: 'help', icon: '❓', label: 'Yardım' },
    ];

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Profile Header */}
            <View style={styles.profileCard}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {user?.username?.charAt(0).toUpperCase() || '?'}
                    </Text>
                </View>
                <Text style={styles.username}>{user?.username || 'Kullanıcı'}</Text>
                <Text style={styles.email}>{user?.email || ''}</Text>
                <View style={styles.roleContainer}>
                    <Text style={styles.roleText}>{getRoleLabel()}</Text>
                </View>
            </View>

            {/* Tenant Info */}
            <View style={styles.tenantCard}>
                <Text style={styles.tenantIcon}>🏢</Text>
                <View style={styles.tenantInfo}>
                    <Text style={styles.tenantLabel}>Kurum</Text>
                    <Text style={styles.tenantName}>
                        {user?.tenant?.name || 'Arkadaş Özel Eğitim'}
                    </Text>
                </View>
            </View>

            {/* Menu */}
            <View style={styles.menuCard}>
                {menuItems.map((item, index) => (
                    <TouchableOpacity
                        key={item.id}
                        style={[
                            styles.menuItem,
                            index < menuItems.length - 1 && styles.menuItemBorder,
                        ]}
                        onPress={() => Alert.alert(item.label, 'Bu özellik yakında eklenecek.')}
                        activeOpacity={0.6}
                    >
                        <Text style={styles.menuIcon}>{item.icon}</Text>
                        <Text style={styles.menuLabel}>{item.label}</Text>
                        {item.badge && (
                            <View style={styles.menuBadge}>
                                <Text style={styles.menuBadgeText}>{item.badge}</Text>
                            </View>
                        )}
                        <Text style={styles.menuArrow}>›</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Logout */}
            <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
                activeOpacity={0.8}
            >
                <Text style={styles.logoutText}>🚪 Çıkış Yap</Text>
            </TouchableOpacity>

            {/* Version */}
            <Text style={styles.version}>Arkadaş Mobil v1.0.0</Text>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    content: {
        padding: 20,
        paddingTop: 60,
        paddingBottom: 100,
    },
    profileCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        marginBottom: 16,
        ...getShadowStyle({
            color: '#000',
            offset: { width: 0, height: 2 },
            opacity: 0.05,
            radius: 8,
            elevation: 2,
        }),
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 24,
        backgroundColor: '#2563eb',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    avatarText: {
        fontSize: 32,
        fontWeight: '700',
        color: '#fff',
    },
    username: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1e293b',
    },
    email: {
        fontSize: 15,
        color: '#64748b',
        marginTop: 4,
    },
    roleContainer: {
        backgroundColor: '#dbeafe',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        marginTop: 12,
    },
    roleText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#2563eb',
    },
    tenantCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
    },
    tenantIcon: {
        fontSize: 32,
        marginRight: 12,
    },
    tenantInfo: {
        flex: 1,
    },
    tenantLabel: {
        fontSize: 12,
        color: '#94a3b8',
        fontWeight: '500',
    },
    tenantName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
        marginTop: 2,
    },
    menuCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 24,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
    },
    menuItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    menuIcon: {
        fontSize: 22,
        marginRight: 12,
    },
    menuLabel: {
        flex: 1,
        fontSize: 16,
        color: '#1e293b',
        fontWeight: '500',
    },
    menuBadge: {
        backgroundColor: '#ef4444',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        marginRight: 8,
    },
    menuBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    menuArrow: {
        fontSize: 24,
        color: '#cbd5e1',
    },
    logoutButton: {
        backgroundColor: '#fef2f2',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#fecaca',
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#dc2626',
    },
    version: {
        textAlign: 'center',
        color: '#94a3b8',
        fontSize: 13,
        marginTop: 24,
    },
});
