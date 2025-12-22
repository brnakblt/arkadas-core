import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    FlatList,
} from 'react-native';

// ============================================================
// Types
// ============================================================

interface Student {
    id: string;
    name: string;
    status: 'present' | 'absent' | 'late' | 'pending';
    time?: string;
}

interface AttendanceScreenProps {
    navigation: {
        goBack: () => void;
    };
}

// ============================================================
// Attendance Screen
// ============================================================

export function AttendanceScreen({ navigation }: AttendanceScreenProps) {
    const [students, setStudents] = useState<Student[]>([]);
    const [filter, setFilter] = useState<'all' | 'present' | 'absent' | 'pending'>('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStudents();
    }, []);

    const loadStudents = async () => {
        setLoading(true);
        try {
            // Mock data - in production fetch from API
            await new Promise((r) => setTimeout(r, 500));
            setStudents([
                { id: '1', name: 'Ahmet Yılmaz', status: 'present', time: '08:45' },
                { id: '2', name: 'Ayşe Demir', status: 'present', time: '08:50' },
                { id: '3', name: 'Mehmet Kaya', status: 'absent' },
                { id: '4', name: 'Fatma Şahin', status: 'late', time: '09:15' },
                { id: '5', name: 'Ali Öztürk', status: 'pending' },
                { id: '6', name: 'Zeynep Arslan', status: 'present', time: '08:40' },
                { id: '7', name: 'Emre Yıldız', status: 'pending' },
                { id: '8', name: 'Selin Çelik', status: 'present', time: '08:55' },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = (studentId: string) => {
        setStudents((prev) =>
            prev.map((s) => {
                if (s.id !== studentId) return s;
                const newStatus =
                    s.status === 'pending' ? 'present' : s.status === 'present' ? 'absent' : 'present';
                return {
                    ...s,
                    status: newStatus,
                    time: newStatus === 'present' ? new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : undefined,
                };
            })
        );
    };

    const markAllPresent = () => {
        const time = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
        setStudents((prev) =>
            prev.map((s) => ({ ...s, status: 'present' as const, time }))
        );
    };

    const filteredStudents = students.filter((s) => {
        if (filter === 'all') return true;
        return s.status === filter;
    });

    const stats = {
        total: students.length,
        present: students.filter((s) => s.status === 'present').length,
        absent: students.filter((s) => s.status === 'absent').length,
        pending: students.filter((s) => s.status === 'pending').length,
    };

    const getStatusColor = (status: Student['status']) => {
        switch (status) {
            case 'present':
                return '#22c55e';
            case 'absent':
                return '#ef4444';
            case 'late':
                return '#f59e0b';
            default:
                return '#9ca3af';
        }
    };

    const getStatusIcon = (status: Student['status']) => {
        switch (status) {
            case 'present':
                return '✅';
            case 'absent':
                return '❌';
            case 'late':
                return '⏰';
            default:
                return '⚪';
        }
    };

    const getStatusText = (status: Student['status']) => {
        switch (status) {
            case 'present':
                return 'Geldi';
            case 'absent':
                return 'Gelmedi';
            case 'late':
                return 'Geç Geldi';
            default:
                return 'Bekliyor';
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={navigation.goBack}>
                    <Text style={styles.backButton}>← Geri</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>📋 Yoklama</Text>
                <TouchableOpacity onPress={markAllPresent}>
                    <Text style={styles.markAllButton}>Tümü Geldi</Text>
                </TouchableOpacity>
            </View>

            {/* Stats Bar */}
            <View style={styles.statsBar}>
                <StatPill label="Toplam" value={stats.total} color="#6b7280" />
                <StatPill label="Geldi" value={stats.present} color="#22c55e" />
                <StatPill label="Gelmedi" value={stats.absent} color="#ef4444" />
                <StatPill label="Bekliyor" value={stats.pending} color="#9ca3af" />
            </View>

            {/* Filter Tabs */}
            <View style={styles.filterTabs}>
                {(['all', 'present', 'absent', 'pending'] as const).map((f) => (
                    <TouchableOpacity
                        key={f}
                        style={[styles.filterTab, filter === f && styles.filterTabActive]}
                        onPress={() => setFilter(f)}
                    >
                        <Text
                            style={[styles.filterTabText, filter === f && styles.filterTabTextActive]}
                        >
                            {f === 'all' ? 'Tümü' : f === 'present' ? 'Geldi' : f === 'absent' ? 'Gelmedi' : 'Bekliyor'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Student List */}
            <FlatList
                data={filteredStudents}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.studentCard}
                        onPress={() => toggleStatus(item.id)}
                    >
                        <View style={styles.studentInfo}>
                            <Text style={styles.studentName}>{item.name}</Text>
                            {item.time && (
                                <Text style={styles.studentTime}>🕐 {item.time}</Text>
                            )}
                        </View>
                        <View
                            style={[
                                styles.statusBadge,
                                { backgroundColor: getStatusColor(item.status) + '20' },
                            ]}
                        >
                            <Text style={styles.statusIcon}>{getStatusIcon(item.status)}</Text>
                            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                                {getStatusText(item.status)}
                            </Text>
                        </View>
                    </TouchableOpacity>
                )}
            />

            {/* Submit Button */}
            <View style={styles.footer}>
                <TouchableOpacity style={styles.submitButton}>
                    <Text style={styles.submitButtonText}>💾 Yoklamayı Kaydet</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

// ============================================================
// Stat Pill Component
// ============================================================

function StatPill({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <View style={[styles.statPill, { borderColor: color }]}>
            <Text style={[styles.statPillValue, { color }]}>{value}</Text>
            <Text style={styles.statPillLabel}>{label}</Text>
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#3b82f6',
        padding: 16,
        paddingTop: 60,
    },
    backButton: {
        color: 'white',
        fontSize: 16,
    },
    headerTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    markAllButton: {
        color: '#bfdbfe',
        fontSize: 14,
    },
    statsBar: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 16,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    statPill: {
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
    },
    statPillValue: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    statPillLabel: {
        fontSize: 10,
        color: '#6b7280',
        marginTop: 2,
    },
    filterTabs: {
        flexDirection: 'row',
        padding: 8,
        backgroundColor: 'white',
    },
    filterTab: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 8,
    },
    filterTabActive: {
        backgroundColor: '#3b82f6',
    },
    filterTabText: {
        fontSize: 13,
        color: '#6b7280',
    },
    filterTabTextActive: {
        color: 'white',
        fontWeight: '600',
    },
    list: {
        padding: 16,
    },
    studentCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 8,
        boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)',
        elevation: 1,
    },
    studentInfo: {
        flex: 1,
    },
    studentName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#1f2937',
    },
    studentTime: {
        fontSize: 12,
        color: '#9ca3af',
        marginTop: 4,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    statusIcon: {
        fontSize: 14,
        marginRight: 4,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    footer: {
        padding: 16,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
    },
    submitButton: {
        backgroundColor: '#3b82f6',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    submitButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});
