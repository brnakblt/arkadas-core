import { useEffect, useLayoutEffect } from 'react';
import { Platform } from 'react-native';

/**
 * A hook that resolves to useEffect on the server and useLayoutEffect on the client.
 * This prevents the "useLayoutEffect does nothing on the server" warning during SSR.
 */
export const useIsomorphicLayoutEffect =
    Platform.OS === 'web' && typeof window === 'undefined'
        ? useEffect
        : useLayoutEffect;
