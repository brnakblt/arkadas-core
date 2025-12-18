import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';

// ============================================================
// Types
// ============================================================

interface DashboardStats {
    totalStudents: number;
    presentToday: number;
    absentToday: number;
    activeRoutes: number;
}

interface QuickAction {
    id: string;
    title: string;
    icon: string;
    route: string;
}

interface RecentActivity {
    id: string;
    action: string;
    time: string;
    icon: string;
}

interface DashboardScreenProps {
    navigation: {
        navigate: (route: string) => void;
    };
}

// ============================================================
// Dashboard Screen
// ============================================================

export function DashboardScreen({ navigation }: DashboardScreenProps) {
    const [stats, setStats] = useState<DashboardStats>({
        totalStudents: 0,
        presentToday: 0,
        absentToday: 0,
        activeRoutes: 0,
    });
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);

    const quickActions: QuickAction[] = [
        { id: '1', title: 'Yoklama Al', icon: '📋', route: 'Attendance' },
        { id: '2', title: 'QR Tara', icon: '📷', route: 'QRAttendance' },
        { id: '3', title: 'Servis Takip', icon: '🚌', route: 'ServiceTracking' },
        { id: '4', title: 'Program', icon: '📅', route: 'Schedule' },
    ];

    const recentActivity: RecentActivity[] = [
        { id: '1', action: 'Sabah yoklaması alındı', time: '09:15', icon: '✅' },
        { id: '2', action: 'Servis 1 hareket etti', time: '08:30', icon: '🚌' },
        { id: '3', action: 'Yeni veli mesajı', time: '08:00', icon: '💬' },
    ];

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        setLoading(true);
        try {
            // In production, fetch from API
            await new Promise((r) => setTimeout(r, 1000));
            setStats({
                totalStudents: 45,
                presentToday: 42,
                absentToday: 3,
                activeRoutes: 2,
            });
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadStats();
        setRefreshing(false);
    };

    const attendancePercentage = stats.totalStudents
        ? Math.round((stats.presentToday / stats.totalStudents) * 100)
        : 0;

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.greeting}>Günaydın! 👋</Text>
                <Text style={styles.date}>
                    {new Date().toLocaleDateString('tr-TR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                    })}
                </Text>
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* Stats Cards */}
                <View style={styles.statsGrid}>
                    <StatCard
                        title="Toplam Öğrenci"
                        value={stats.totalStudents}
                        icon="👥"
                        color="#3b82f6"
                    />
                    <StatCard
                        title="Bugün Gelen"
                        value={stats.presentToday}
                        icon="✅"
                        color="#22c55e"
                    />
                    <StatCard
                        title="Bugün Gelmeyen"
                        value={stats.absentToday}
                        icon="❌"
                        color="#ef4444"
                    />
                    <StatCard
                        title="Aktif Servis"
                        value={stats.activeRoutes}
                        icon="🚌"
                        color="#f59e0b"
                    />
                </View>

                {/* Attendance Progress */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Günlük Yoklama</Text>
                    <View style={styles.progressContainer}>
                        <View style={styles.progressBar}>
                            <View
                                style={[styles.progressFill, { width: `${attendancePercentage}%` }]}
                            />
                        </View>
                        <Text style={styles.progressText}>{attendancePercentage}%</Text>
                    </View>
                </View>

                {/* Quick Actions */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Hızlı İşlemler</Text>
                    <View style={styles.quickActionsGrid}>
                        {quickActions.map((action) => (
                            <TouchableOpacity
                                key={action.id}
                                style={styles.quickAction}
                                onPress={() => navigation.navigate(action.route)}
                            >
                                <Text style={styles.quickActionIcon}>{action.icon}</Text>
                                <Text style={styles.quickActionTitle}>{action.title}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Recent Activity */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Son Aktiviteler</Text>
                    {recentActivity.map((activity) => (
                        <View key={activity.id} style={styles.activityItem}>
                            <Text style={styles.activityIcon}>{activity.icon}</Text>
                            <View style={styles.activityContent}>
                                <Text style={styles.activityAction}>{activity.action}</Text>
                                <Text style={styles.activityTime}>{activity.time}</Text>
                            </View>
                        </View>
                    ))}
                </View>
            </ScrollView>
        </View>
    );
}

// ============================================================
// Stat Card Component
// ============================================================

function StatCard({
    title,
    value,
    icon,
    color,
}: {
    title: string;
    value: number;
    icon: string;
    color: string;
}) {
    return (
        <View style={[styles.statCard, { borderLeftColor: color }]}>
            <Text style={styles.statIcon}>{icon}</Text>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statTitle}>{title}</Text>
        </View>
    );
}

// ============================================================
// Styles
// ============================================================

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f3f4f6',
    },
    header: {
        backgroundColor: '#3b82f6',
        padding: 24,
        paddingTop: 60,
    },
    greeting: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
    },
    date: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 4,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -4,
        marginBottom: 16,
    },
    statCard: {
        width: '48%',
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        margin: 4,
        borderLeftWidth: 4,
        boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.1)',
        elevation: 2,
    },
    statIcon: {
        fontSize: 24,
        marginBottom: 8,
    },
    statValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    statTitle: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 4,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.1)',
        elevation: 2,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: 12,
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    progressBar: {
        flex: 1,
        height: 8,
        backgroundColor: '#e5e7eb',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#22c55e',
        borderRadius: 4,
    },
    progressText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#22c55e',
        width: 50,
        textAlign: 'right',
    },
    quickActionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -4,
    },
    quickAction: {
        width: '23%',
        alignItems: 'center',
        padding: 12,
        margin: 4,
        backgroundColor: '#f9fafb',
        borderRadius: 12,
    },
    quickActionIcon: {
        fontSize: 28,
        marginBottom: 8,
    },
    quickActionTitle: {
        fontSize: 11,
        color: '#4b5563',
        textAlign: 'center',
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    activityIcon: {
        fontSize: 24,
        marginRight: 12,
    },
    activityContent: {
        flex: 1,
    },
    activityAction: {
        fontSize: 14,
        color: '#1f2937',
    },
    activityTime: {
        fontSize: 12,
        color: '#9ca3af',
        marginTop: 2,
    },
});
