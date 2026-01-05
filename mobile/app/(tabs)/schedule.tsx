/**
 * Schedule Screen - Today's sessions
 */

import { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
} from 'react-native';
import { getShadowStyle } from '@/utils/styles';
import { endpoints, BOP } from '../../src/lib/endpoints';

interface UISession {
    id: string;
    time: string;
    duration: number;
    title: string;
    student: string;
    studentId: number;
    type: string;
    status: 'upcoming' | 'completed';
    raw: any;
}

export default function ScheduleScreen() {
    const [sessions, setSessions] = useState<UISession[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [consistencyIssues, setConsistencyIssues] = useState<string[]>([]);

    const loadSessions = async () => {
        const dateStr = selectedDate.toISOString().split('T')[0];
        const data = await endpoints.getDailyPlans(dateStr);

        // Map backend BOP to UI Session format
        const mappedSessions: UISession[] = data.map((item: any) => ({
            id: item.id.toString(),
            time: '09:00', // Default time as BÖP is daily
            duration: 40,
            title: item.plannedModules?.[0]?.skill || 'Bireysel Eğitim',
            student: item.student?.fullName || item.student?.firstName || 'Öğrenci',
            studentId: item.student?.id, // Store student ID for consistency check
            type: 'special',
            status: item.status === 'completed' ? 'completed' : 'upcoming',
            raw: item
        }));
        setSessions(mappedSessions);

        // Check consistency for all students in the schedule
        const issues: string[] = [];
        const studentIds = new Set(mappedSessions.map((s: any) => s.studentId).filter(Boolean));

        for (const studentId of studentIds) {
            const check = await endpoints.checkConsistency(studentId);
            if (!check.valid && check.issues?.length > 0) {
                issues.push(...check.issues.map(i => `${mappedSessions.find((s: any) => s.studentId === studentId)?.student}: ${i}`));
            }
        }
        setConsistencyIssues(issues);
    };

    useEffect(() => {
        loadSessions();
    }, [selectedDate]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadSessions();
        setRefreshing(false);
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'speech': return '#3b82f6';
            case 'special': return '#8b5cf6';
            case 'physio': return '#10b981';
            default: return '#64748b';
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'speech': return 'Konuşma';
            case 'special': return 'Özel Eğitim';
            case 'physio': return 'Fizyo';
            default: return 'Diğer';
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'completed': return { borderLeftColor: '#22c55e' };
            case 'ongoing': return { borderLeftColor: '#f59e0b', backgroundColor: '#fffbeb' };
            default: return { borderLeftColor: '#e2e8f0' };
        }
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('tr-TR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
        });
    };

    const today = new Date();
    const days = [-2, -1, 0, 1, 2].map((offset) => {
        const date = new Date(today);
        date.setDate(date.getDate() + offset);
        return date;
    });

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>📅 Program</Text>
                <Text style={styles.subtitle}>{formatDate(selectedDate)}</Text>
            </View>

            {/* Date selector */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.dateSelector}
                contentContainerStyle={styles.dateSelectorContent}
            >
                {days.map((date) => {
                    const isSelected = date.toDateString() === selectedDate.toDateString();
                    const isToday = date.toDateString() === today.toDateString();

                    return (
                        <TouchableOpacity
                            key={date.toISOString()}
                            style={[styles.dateCard, isSelected && styles.dateCardSelected]}
                            onPress={() => setSelectedDate(date)}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.dateDay, isSelected && styles.dateDaySelected]}>
                                {date.toLocaleDateString('tr-TR', { weekday: 'short' })}
                            </Text>
                            <Text style={[styles.dateNum, isSelected && styles.dateNumSelected]}>
                                {date.getDate()}
                            </Text>
                            {isToday && <View style={styles.todayDot} />}
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            {/* Sessions list */}
            <ScrollView
                style={styles.sessionsList}
                contentContainerStyle={styles.sessionsContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Consistency Alerts */}
                {consistencyIssues.length > 0 && (
                    <View style={styles.alertContainer}>
                        <Text style={styles.alertTitle}>⚠️ Dikkat Gerekenler</Text>
                        {consistencyIssues.map((issue, index) => (
                            <Text key={index} style={styles.alertText}>• {issue}</Text>
                        ))}
                    </View>
                )}

                {sessions.length === 0 ? (
                    <View style={{ alignItems: 'center', marginTop: 40 }}>
                        <Text style={{ color: '#94a3b8' }}>Bugün için plan bulunamadı.</Text>
                    </View>
                ) : (
                    sessions.map((session: any) => (
                        <TouchableOpacity
                            key={session.id}
                            style={[styles.sessionCard, getStatusStyle(session.status)]}
                            activeOpacity={0.7}
                        >
                            <View style={styles.sessionLeft}>
                                <Text style={styles.sessionTime}>{session.time}</Text>
                                <Text style={styles.sessionDuration}>{session.duration} dk</Text>
                            </View>

                            <View style={styles.sessionCenter}>
                                <Text style={styles.sessionTitle}>{session.title}</Text>
                                <Text style={styles.sessionStudent}>{session.student}</Text>
                            </View>

                            <View
                                style={[
                                    styles.sessionBadge,
                                    { backgroundColor: `${getTypeColor(session.type)}15` },
                                ]}
                            >
                                <Text
                                    style={[styles.sessionBadgeText, { color: getTypeColor(session.type) }]}
                                >
                                    {getTypeLabel(session.type)}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    ))
                )}

                {/* Summary */}
                <View style={styles.summary}>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryValue}>{sessions.length}</Text>
                        <Text style={styles.summaryLabel}>Toplam</Text>
                    </View>
                    <View style={styles.summaryItem}>
                        <Text style={[styles.summaryValue, { color: '#22c55e' }]}>
                            {sessions.filter((s) => s.status === 'completed').length}
                        </Text>
                        <Text style={styles.summaryLabel}>Tamamlandı</Text>
                    </View>
                    <View style={styles.summaryItem}>
                        <Text style={[styles.summaryValue, { color: '#3b82f6' }]}>
                            {sessions.filter((s) => s.status === 'upcoming').length}
                        </Text>
                        <Text style={styles.summaryLabel}>Bekleyen</Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 16,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1e293b',
    },
    subtitle: {
        fontSize: 16,
        color: '#64748b',
        marginTop: 4,
        textTransform: 'capitalize',
    },
    dateSelector: {
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    dateSelectorContent: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 8,
    },
    dateCard: {
        width: 56,
        height: 72,
        borderRadius: 12,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    dateCardSelected: {
        backgroundColor: '#2563eb',
    },
    dateDay: {
        fontSize: 12,
        fontWeight: '500',
        color: '#64748b',
        textTransform: 'uppercase',
    },
    dateDaySelected: {
        color: 'rgba(255,255,255,0.8)',
    },
    dateNum: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1e293b',
        marginTop: 4,
    },
    dateNumSelected: {
        color: '#fff',
    },
    todayDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#2563eb',
        marginTop: 4,
    },
    sessionsList: {
        flex: 1,
    },
    sessionsContent: {
        padding: 20,
        paddingBottom: 100,
    },
    alertContainer: {
        backgroundColor: '#fef2f2',
        borderLeftWidth: 4,
        borderLeftColor: '#ef4444',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
    },
    alertTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#991b1b',
        marginBottom: 4,
    },
    alertText: {
        fontSize: 14,
        color: '#b91c1c',
        marginLeft: 4,
        marginBottom: 2,
    },
    sessionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 10,
        borderLeftWidth: 4,
        ...getShadowStyle({
            color: '#000',
            offset: { width: 0, height: 1 },
            opacity: 0.05,
            radius: 2,
            elevation: 1,
        }),
    },
    sessionLeft: {
        width: 56,
        marginRight: 12,
    },
    sessionTime: {
        fontSize: 17,
        fontWeight: '700',
        color: '#1e293b',
    },
    sessionDuration: {
        fontSize: 12,
        color: '#94a3b8',
        marginTop: 2,
    },
    sessionCenter: {
        flex: 1,
    },
    sessionTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1e293b',
    },
    sessionStudent: {
        fontSize: 14,
        color: '#64748b',
        marginTop: 2,
    },
    sessionBadge: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 6,
    },
    sessionBadgeText: {
        fontSize: 11,
        fontWeight: '600',
    },
    summary: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 16,
        marginTop: 16,
    },
    summaryItem: {
        alignItems: 'center',
    },
    summaryValue: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1e293b',
    },
    summaryLabel: {
        fontSize: 13,
        color: '#64748b',
        marginTop: 4,
    },
});
