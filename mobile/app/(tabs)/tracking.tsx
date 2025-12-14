/**
 * Service Tracking Screen for Mobile App
 * 
 * NOTE: Tracking functionality will be handled by external GPS devices.
 * This screen shows status and connection info.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ServiceTrackingScreen() {
    return (
        <View style={styles.container}>
            <View style={styles.card}>
                <Text style={styles.icon}>📡</Text>
                <Text style={styles.title}>Servis Takip Sistemi</Text>
                <Text style={styles.subtitle}>GPS Cihazı ile Takip</Text>
                <View style={styles.statusRow}>
                    <View style={styles.statusDot} />
                    <Text style={styles.statusText}>Sistem Aktif</Text>
                </View>
                <Text style={styles.description}>
                    Servis araçları harici GPS cihazları ile takip edilmektedir.
                    Konum bilgileri otomatik olarak sisteme aktarılır.
                </Text>
            </View>

            <View style={styles.infoCard}>
                <Text style={styles.infoTitle}>ℹ️ Bilgi</Text>
                <Text style={styles.infoText}>
                    Veliler servis konumunu web panelinden takip edebilir.
                    Anlık bildirimler için push notification aktif edilmelidir.
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
        justifyContent: 'center',
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

