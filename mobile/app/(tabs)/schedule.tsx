/**
 * Schedule Screen - Today's sessions
 */

import { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
} from 'react-native';

interface Session {
    id: string;
    time: string;
    duration: number;
    title: string;
    student: string;
    type: 'speech' | 'special' | 'physio' | 'other';
    status: 'upcoming' | 'ongoing' | 'completed';
}

const MOCK_SESSIONS: Session[] = [
    { id: '1', time: '09:00', duration: 40, title: 'Dil ve Konuşma Terapisi', student: 'Ali Yılmaz', type: 'speech', status: 'completed' },
    { id: '2', time: '10:00', duration: 45, title: 'Özel Eğitim', student: 'Ayşe Demir', type: 'special', status: 'ongoing' },
    { id: '3', time: '11:00', duration: 30, title: 'Fizyoterapi', student: 'Mehmet Kaya', type: 'physio', status: 'upcoming' },
    { id: '4', time: '13:00', duration: 40, title: 'Dil ve Konuşma Terapisi', student: 'Zeynep Arslan', type: 'speech', status: 'upcoming' },
    { id: '5', time: '14:00', duration: 45, title: 'Özel Eğitim', student: 'Can Yıldırım', type: 'special', status: 'upcoming' },
    { id: '6', time: '15:00', duration: 30, title: 'Fizyoterapi', student: 'Elif Öztürk', type: 'physio', status: 'upcoming' },
];

export default function ScheduleScreen() {
    const [sessions] = useState<Session[]>(MOCK_SESSIONS);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());

    const onRefresh = async () => {
        setRefreshing(true);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setRefreshing(false);
    };

    const getTypeColor = (type: Session['type']) => {
        switch (type) {
            case 'speech':
                return '#3b82f6';
            case 'special':
                return '#8b5cf6';
            case 'physio':
                return '#10b981';
            default:
                return '#64748b';
        }
    };

    const getTypeLabel = (type: Session['type']) => {
        switch (type) {
            case 'speech':
                return 'Konuşma';
            case 'special':
                return 'Özel Eğitim';
            case 'physio':
                return 'Fizyo';
            default:
                return 'Diğer';
        }
    };

    const getStatusStyle = (status: Session['status']) => {
        switch (status) {
            case 'completed':
                return { borderLeftColor: '#22c55e' };
            case 'ongoing':
                return { borderLeftColor: '#f59e0b', backgroundColor: '#fffbeb' };
            default:
                return { borderLeftColor: '#e2e8f0' };
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
                {sessions.map((session) => (
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
                ))}

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
                        <Text style={[styles.summaryValue, { color: '#f59e0b' }]}>
                            {sessions.filter((s) => s.status === 'ongoing').length}
                        </Text>
                        <Text style={styles.summaryLabel}>Devam Eden</Text>
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
    sessionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 10,
        borderLeftWidth: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
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
