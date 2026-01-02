/**
 * Schedule Screen
 */

import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getSchedules } from '../../src/api';

export default function ScheduleScreen() {
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['schedules'],
        queryFn: () => getSchedules(),
    });

    const renderScheduleItem = ({ item }: { item: any }) => (
        <View style={styles.item}>
            <View style={styles.itemHeader}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <View style={[styles.badge, { backgroundColor: getTypeColor(item.scheduleType) }]}>
                    <Text style={styles.badgeText}>{getTypeLabel(item.scheduleType)}</Text>
                </View>
            </View>
            <View style={styles.itemDetails}>
                <Text style={styles.time}>
                    🕐 {formatTime(item.startTime)} - {formatTime(item.endTime)}
                </Text>
                {item.location && (
                    <Text style={styles.location}>📍 {item.location}</Text>
                )}
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <FlatList
                data={data?.data || []}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderScheduleItem}
                refreshControl={
                    <RefreshControl refreshing={isLoading} onRefresh={refetch} />
                }
                ListEmptyComponent={
                    <Text style={styles.empty}>Program bulunamadı</Text>
                }
                contentContainerStyle={styles.list}
            />
        </View>
    );
}

function getTypeColor(type: string): string {
    const colors: Record<string, string> = {
        class: '#22c55e',
        therapy: '#8b5cf6',
        meeting: '#f59e0b',
        event: '#3b82f6',
    };
    return colors[type] || '#6b7280';
}

function getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
        class: 'Ders',
        therapy: 'Terapi',
        meeting: 'Toplantı',
        event: 'Etkinlik',
    };
    return labels[type] || type;
}

function formatTime(dateStr: string): string {
    return new Date(dateStr).toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit',
    });
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    list: {
        padding: 12,
    },
    item: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    itemTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        flex: 1,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    badgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '500',
    },
    itemDetails: {
        gap: 4,
    },
    time: {
        color: '#666',
        fontSize: 14,
    },
    location: {
        color: '#666',
        fontSize: 14,
    },
    empty: {
        textAlign: 'center',
        color: '#999',
        padding: 40,
    },
});
