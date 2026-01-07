'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState, ReactNode } from 'react';

interface QueryProviderProps {
    children: ReactNode;
}

/**
 * React Query Provider with optimized defaults
 */
export function QueryProvider({ children }: QueryProviderProps) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        // Stale time: 1 minute (data considered fresh)
                        staleTime: 60 * 1000,
                        // Cache time: 5 minutes
                        gcTime: 5 * 60 * 1000,
                        // Retry failed requests 3 times
                        retry: 3,
                        // Don't refetch on window focus by default
                        refetchOnWindowFocus: false,
                        // Refetch on reconnect
                        refetchOnReconnect: true,
                    },
                    mutations: {
                        // Retry failed mutations once
                        retry: 1,
                    },
                },
            })
    );

    return (
        <QueryClientProvider client={queryClient}>
            {children}
            {process.env.NODE_ENV === 'development' && (
                <ReactQueryDevtools initialIsOpen={false} />
            )}
        </QueryClientProvider>
    );
}

export { queryClient } from './queryClient';
