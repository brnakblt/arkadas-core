/**
 * Tab Layout - Main app navigation
 */

import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';

interface TabIconProps {
    focused: boolean;
    icon: string;
    label: string;
}

function TabIcon({ focused, icon, label }: TabIconProps) {
    return (
        <View style={styles.tabItem}>
            <Text style={[styles.icon, focused && styles.iconFocused]}>{icon}</Text>
            <Text style={[styles.label, focused && styles.labelFocused]}>{label}</Text>
        </View>
    );
}

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: styles.tabBar,
                tabBarShowLabel: false,
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Ana Sayfa',
                    tabBarIcon: ({ focused }) => (
                        <TabIcon focused={focused} icon="🏠" label="Ana Sayfa" />
                    ),
                }}
            />
            <Tabs.Screen
                name="attendance"
                options={{
                    title: 'Yoklama',
                    tabBarIcon: ({ focused }) => (
                        <TabIcon focused={focused} icon="📸" label="Yoklama" />
                    ),
                }}
            />
            <Tabs.Screen
                name="schedule"
                options={{
                    title: 'Program',
                    tabBarIcon: ({ focused }) => (
                        <TabIcon focused={focused} icon="📅" label="Program" />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profil',
                    tabBarIcon: ({ focused }) => (
                        <TabIcon focused={focused} icon="👤" label="Profil" />
                    ),
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        height: 80,
        paddingTop: 8,
        paddingBottom: 20,
    },
    tabItem: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    icon: {
        fontSize: 24,
        marginBottom: 2,
    },
    iconFocused: {
        transform: [{ scale: 1.1 }],
    },
    label: {
        fontSize: 11,
        color: '#94a3b8',
        fontWeight: '500',
    },
    labelFocused: {
        color: '#2563eb',
        fontWeight: '600',
    },
});
