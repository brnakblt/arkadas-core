/**
 * Root Layout - App entry with providers
 */

import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore } from '@/stores/auth';

// Keep splash visible while loading
SplashScreen.preventAutoHideAsync();

// Suppress specific warnings/errors that are known/unavoidable
const originalConsoleError = console.error;
console.error = (...args) => {
    if (typeof args[0] === 'string' && args[0].includes('useLayoutEffect does nothing on the server')) {
        return;
    }
    originalConsoleError(...args);
};

// Polyfill useLayoutEffect for SSR to prevent warnings from dependencies
if (typeof window === 'undefined') {
    // @ts-ignore
    React.useLayoutEffect = React.useEffect;
}

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            retry: 2,
        },
    },
});

export default function RootLayout() {
    const init = useAuthStore((state) => state.init);
    const isLoading = useAuthStore((state) => state.isLoading);

    useEffect(() => {
        init();
    }, [init]);

    useEffect(() => {
        if (!isLoading) {
            SplashScreen.hideAsync();
        }
    }, [isLoading]);

    return (
        <QueryClientProvider client={queryClient}>
            <StatusBar style="auto" />
            <Stack
                screenOptions={{
                    headerShown: false,
                    animation: 'slide_from_right',
                }}
            >
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(tabs)" />
            </Stack>
        </QueryClientProvider>
    );
}
