/**
 * Attendance Screen for Mobile App
 * 
 * NOTE: Attendance functionality will be handled by remote cameras.
 * This screen shows status and info about the system.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function AttendanceScreen() {
    return (
        <View style={styles.container}>
            <View style={styles.card}>
                <Text style={styles.icon}>📸</Text>
                <Text style={styles.title}>Yoklama Sistemi</Text>
                <Text style={styles.subtitle}>Yüz Tanıma ile Otomatik Kayıt</Text>
                <View style={styles.statusRow}>
                    <View style={styles.statusDot} />
                    <Text style={styles.statusText}>Sistem Aktif</Text>
                </View>
                <Text style={styles.description}>
                    Yoklama işlemleri kurum girişindeki kameraları ile otomatik olarak yapılmaktadır.
                    Öğrenci giriş/çıkışları anlık olarak sisteme kaydedilir.
                </Text>
            </View>

            <View style={styles.statsCard}>
                <Text style={styles.statsTitle}>📊 Bugünün Özeti</Text>
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>-</Text>
                        <Text style={styles.statLabel}>Giriş</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>-</Text>
                        <Text style={styles.statLabel}>Çıkış</Text>
                    </View>
                </View>
            </View>

            <View style={styles.infoCard}>
                <Text style={styles.infoTitle}>ℹ️ Bilgi</Text>
                <Text style={styles.infoText}>
                    Veliler yoklama bildirimlerini push notification ile alabilir.
                    Detaylı raporlar web panelinden görüntülenebilir.
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        padding: 16,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        marginTop: 32,
    },
    icon: {
        fontSize: 48,
        marginBottom: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 16,
        color: '#6b7280',
        marginBottom: 16,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    statusDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#22c55e',
        marginRight: 8,
    },
    statusText: {
        fontSize: 14,
        color: '#22c55e',
        fontWeight: '600',
    },
    description: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: 20,
    },
    statsCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginTop: 16,
    },
    statsTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: 12,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    statItem: {
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    statNumber: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#3b82f6',
    },
    statLabel: {
        fontSize: 14,
        color: '#6b7280',
    },
    statDivider: {
        width: 1,
        height: 40,
        backgroundColor: '#e5e7eb',
    },
    infoCard: {
        backgroundColor: '#eff6ff',
        borderRadius: 12,
        padding: 16,
        marginTop: 16,
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e40af',
        marginBottom: 8,
    },
    infoText: {
        fontSize: 14,
        color: '#3b82f6',
        lineHeight: 20,
    },
});

