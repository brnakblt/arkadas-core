/**
 * Root Layout with Auth Check
 */

import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '../src/stores';

const queryClient = new QueryClient();

export default function RootLayout() {
    const { checkAuth, isLoading } = useAuthStore();

    useEffect(() => {
        checkAuth();
    }, []);

    return (
        <QueryClientProvider client={queryClient}>
            <StatusBar style="auto" />
            <Stack
                screenOptions={{
                    headerStyle: { backgroundColor: '#2563eb' },
                    headerTintColor: '#fff',
                    headerTitleStyle: { fontWeight: 'bold' },
                }}
            >
                <Stack.Screen
                    name="(auth)"
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="(tabs)"
                    options={{ headerShown: false }}
                />
            </Stack>
        </QueryClientProvider>
    );
}
