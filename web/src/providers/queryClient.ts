import { QueryClient } from '@tanstack/react-query';

/**
 * Singleton QueryClient instance for use outside React
 */
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 60 * 1000,
            gcTime: 5 * 60 * 1000,
            retry: 3,
            refetchOnWindowFocus: false,
        },
    },
});

/**
 * Invalidate queries by key
 */
export function invalidateQueries(queryKey: string[]) {
    return queryClient.invalidateQueries({ queryKey });
}

/**
 * Prefetch query data
 */
export async function prefetchQuery<T>(
    queryKey: string[],
    queryFn: () => Promise<T>
) {
    await queryClient.prefetchQuery({ queryKey, queryFn });
}

/**
 * Set query data directly (for optimistic updates)
 */
export function setQueryData<T>(queryKey: string[], data: T) {
    queryClient.setQueryData(queryKey, data);
}
