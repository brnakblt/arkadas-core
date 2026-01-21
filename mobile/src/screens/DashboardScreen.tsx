
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import * as SecureStore from 'expo-secure-store';

import { dataService } from '../services/dataService';

export const DashboardScreen = ({ navigation, route }: any) => {
    // Determine user name from route params or default
    const userName = route.params?.username || 'Kullanıcı';
    const [stats, setStats] = useState({ sessionCount: 0, pendingTasks: 0 });

    React.useEffect(() => {
        const loadData = async () => {
            const data = await dataService.getDashboardStats();
            setStats(data);
        };
        loadData();
    }, []);

    const handleLogout = async () => {
        await SecureStore.deleteItemAsync('jwt');
        navigation.replace('Login');
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Merhaba, {userName}</Text>
                <Text style={styles.subtitle}>Arkadaş Özel Eğitim</Text>
            </View>

            <View style={styles.content}>
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Ders Programı</Text>
                    <Text style={styles.cardText}>Bugün {stats.sessionCount} seansınız var.</Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Öğrenci Listesi</Text>
                    <Text style={styles.cardText}>{stats.pendingTasks} kayıtlı öğrenci var.</Text>
                </View>
            </View>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Text style={styles.logoutText}>Çıkış Yap</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
        padding: 20
    },
    header: {
        marginBottom: 30,
        marginTop: 20
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1e293b'
    },
    subtitle: {
        fontSize: 16,
        color: '#64748b'
    },
    content: {
        flex: 1,
        gap: 16
    },
    card: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#334155',
        marginBottom: 8
    },
    cardText: {
        color: '#64748b'
    },
    footer: {
        marginTop: 'auto'
    },
    logoutButton: {
        backgroundColor: '#ef4444',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center'
    },
    logoutText: {
        color: 'white',
        fontWeight: 'bold'
    }
});
