/**
 * Home Screen
 */

import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getTodaySchedules, getMyAttendance } from '../../src/api';
import { useAuthStore } from '../../src/stores';

export default function HomeScreen() {
    const { user } = useAuthStore();

    const { data: schedules, isLoading: schedulesLoading, refetch: refetchSchedules } = useQuery({
        queryKey: ['todaySchedules'],
        queryFn: getTodaySchedules,
    });

    const { data: attendance, isLoading: attendanceLoading, refetch: refetchAttendance } = useQuery({
        queryKey: ['myAttendance'],
        queryFn: getMyAttendance,
    });

    const onRefresh = () => {
        refetchSchedules();
        refetchAttendance();
    };

    return (
        <ScrollView
            style={styles.container}
            refreshControl={
                <RefreshControl
                    refreshing={schedulesLoading || attendanceLoading}
                    onRefresh={onRefresh}
                />
            }
        >
            <View style={styles.welcome}>
                <Text style={styles.greeting}>Hoş Geldiniz!</Text>
                <Text style={styles.email}>{user?.email}</Text>
                <Text style={styles.tenant}>Kurum: {user?.tenant}</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Bugünün Programı</Text>
                {schedules?.data?.length ? (
                    schedules.data.slice(0, 5).map((schedule) => (
                        <View key={schedule.id} style={styles.scheduleItem}>
                            <Text style={styles.scheduleTitle}>{schedule.title}</Text>
                            <Text style={styles.scheduleTime}>
                                {new Date(schedule.startTime).toLocaleTimeString('tr-TR', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </Text>
                        </View>
                    ))
                ) : (
                    <Text style={styles.empty}>Bugün program yok</Text>
                )}
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Son Yoklamalar</Text>
                {attendance?.data?.length ? (
                    attendance.data.slice(0, 5).map((log) => (
                        <View key={log.id} style={styles.attendanceItem}>
                            <Text style={styles.attendanceType}>
                                {log.eventType === 'check_in' ? '✅ Giriş' : '🚪 Çıkış'}
                            </Text>
                            <Text style={styles.attendanceTime}>
                                {new Date(log.recordedAt).toLocaleString('tr-TR')}
                            </Text>
                        </View>
                    ))
                ) : (
                    <Text style={styles.empty}>Yoklama kaydı yok</Text>
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    welcome: {
        backgroundColor: '#2563eb',
        padding: 20,
        paddingTop: 40,
    },
    greeting: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    email: {
        color: '#fff',
        opacity: 0.9,
        marginTop: 4,
    },
    tenant: {
        color: '#fff',
        opacity: 0.7,
        marginTop: 2,
        fontSize: 12,
    },
    section: {
        backgroundColor: '#fff',
        margin: 12,
        padding: 16,
        borderRadius: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
        color: '#333',
    },
    scheduleItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    scheduleTitle: {
        fontSize: 15,
        color: '#333',
    },
    scheduleTime: {
        fontSize: 14,
        color: '#666',
    },
    attendanceItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    attendanceType: {
        fontSize: 15,
    },
    attendanceTime: {
        fontSize: 13,
        color: '#666',
    },
    empty: {
        color: '#999',
        textAlign: 'center',
        paddingVertical: 20,
    },
});
