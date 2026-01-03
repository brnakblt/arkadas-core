/**
 * Home Screen - Dashboard with quick actions and today's summary
 */

import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useState, useCallback } from 'react';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/auth';

export default function HomeScreen() {
    const user = useAuthStore((state) => state.user);
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        // TODO: Fetch fresh data
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setRefreshing(false);
    }, []);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Günaydın';
        if (hour < 18) return 'İyi günler';
        return 'İyi akşamlar';
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

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
        >
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>{getGreeting()},</Text>
                    <Text style={styles.username}>{user?.username || 'Kullanıcı'}</Text>
                    <Text style={styles.role}>{getRoleLabel()}</Text>
                </View>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {user?.username?.charAt(0).toUpperCase() || '?'}
                    </Text>
                </View>
            </View>

            {/* Today's Stats */}
            <View style={styles.statsContainer}>
                <Text style={styles.sectionTitle}>Bugün</Text>
                <View style={styles.statsGrid}>
                    <View style={[styles.statCard, { backgroundColor: '#dcfce7' }]}>
                        <Text style={styles.statValue}>42</Text>
                        <Text style={styles.statLabel}>Mevcut</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: '#fef9c3' }]}>
                        <Text style={styles.statValue}>3</Text>
                        <Text style={styles.statLabel}>Geç</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: '#fee2e2' }]}>
                        <Text style={styles.statValue}>2</Text>
                        <Text style={styles.statLabel}>Yok</Text>
                    </View>
                </View>
            </View>

            {/* Quick Actions */}
            <View style={styles.actionsContainer}>
                <Text style={styles.sectionTitle}>Hızlı İşlemler</Text>
                <View style={styles.actionsGrid}>
                    <TouchableOpacity
                        style={styles.actionCard}
                        onPress={() => router.push('/(tabs)/attendance')}
                        activeOpacity={0.8}
                    >
                        <View style={[styles.actionIcon, { backgroundColor: '#dbeafe' }]}>
                            <Text style={styles.actionEmoji}>📸</Text>
                        </View>
                        <Text style={styles.actionLabel}>Yoklama Al</Text>
                        <Text style={styles.actionDesc}>Yüz tanıma ile</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionCard}
                        onPress={() => router.push('/(tabs)/schedule')}
                        activeOpacity={0.8}
                    >
                        <View style={[styles.actionIcon, { backgroundColor: '#ede9fe' }]}>
                            <Text style={styles.actionEmoji}>📅</Text>
                        </View>
                        <Text style={styles.actionLabel}>Program</Text>
                        <Text style={styles.actionDesc}>Bugünün seansları</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Upcoming Sessions */}
            <View style={styles.sessionsContainer}>
                <Text style={styles.sectionTitle}>Yaklaşan Seanslar</Text>

                <View style={styles.sessionCard}>
                    <View style={styles.sessionTime}>
                        <Text style={styles.sessionTimeText}>10:00</Text>
                    </View>
                    <View style={styles.sessionInfo}>
                        <Text style={styles.sessionTitle}>Dil ve Konuşma Terapisi</Text>
                        <Text style={styles.sessionStudent}>Ali Yılmaz</Text>
                    </View>
                    <View style={[styles.sessionBadge, { backgroundColor: '#dbeafe' }]}>
                        <Text style={styles.sessionBadgeText}>30dk</Text>
                    </View>
                </View>

                <View style={styles.sessionCard}>
                    <View style={styles.sessionTime}>
                        <Text style={styles.sessionTimeText}>11:00</Text>
                    </View>
                    <View style={styles.sessionInfo}>
                        <Text style={styles.sessionTitle}>Özel Eğitim</Text>
                        <Text style={styles.sessionStudent}>Ayşe Demir</Text>
                    </View>
                    <View style={[styles.sessionBadge, { backgroundColor: '#ede9fe' }]}>
                        <Text style={styles.sessionBadgeText}>45dk</Text>
                    </View>
                </View>

                <View style={styles.sessionCard}>
                    <View style={styles.sessionTime}>
                        <Text style={styles.sessionTimeText}>14:00</Text>
                    </View>
                    <View style={styles.sessionInfo}>
                        <Text style={styles.sessionTitle}>Fizyoterapi</Text>
                        <Text style={styles.sessionStudent}>Mehmet Kaya</Text>
                    </View>
                    <View style={[styles.sessionBadge, { backgroundColor: '#fef3c7' }]}>
                        <Text style={styles.sessionBadgeText}>30dk</Text>
                    </View>
                </View>
            </View>
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
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24,
    },
    greeting: {
        fontSize: 16,
        color: '#64748b',
    },
    username: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1e293b',
        marginTop: 2,
    },
    role: {
        fontSize: 14,
        color: '#2563eb',
        fontWeight: '500',
        marginTop: 2,
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: '#2563eb',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 24,
        fontWeight: '700',
        color: '#fff',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 12,
    },
    statsContainer: {
        marginBottom: 24,
    },
    statsGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    statCard: {
        flex: 1,
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1e293b',
    },
    statLabel: {
        fontSize: 13,
        color: '#475569',
        fontWeight: '500',
        marginTop: 4,
    },
    actionsContainer: {
        marginBottom: 24,
    },
    actionsGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    actionCard: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    actionIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    actionEmoji: {
        fontSize: 24,
    },
    actionLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
    },
    actionDesc: {
        fontSize: 13,
        color: '#64748b',
        marginTop: 2,
    },
    sessionsContainer: {
        marginBottom: 24,
    },
    sessionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    sessionTime: {
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        marginRight: 12,
    },
    sessionTimeText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#475569',
    },
    sessionInfo: {
        flex: 1,
    },
    sessionTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1e293b',
    },
    sessionStudent: {
        fontSize: 13,
        color: '#64748b',
        marginTop: 2,
    },
    sessionBadge: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 6,
    },
    sessionBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#475569',
    },
});
