import { renderHook, act } from '@testing-library/react-native';
import { useLocation } from '../hooks/useLocation';

describe('useLocation', () => {
    it('should return initial state', () => {
        const { result } = renderHook(() => useLocation());

        expect(result.current.location).toBeNull();
        expect(result.current.isTracking).toBe(false);
        expect(result.current.error).toBeNull();
    });

    it('should request permission', async () => {
        const { result } = renderHook(() => useLocation());

        await act(async () => {
            const granted = await result.current.requestPermission();
            expect(granted).toBe(true);
        });
    });

    it('should get current location', async () => {
        const { result } = renderHook(() => useLocation());

        await act(async () => {
            const location = await result.current.getCurrentLocation();
            expect(location).toBeDefined();
            expect(location.latitude).toBe(41.0082);
            expect(location.longitude).toBe(28.9784);
        });
    });

    it('should start tracking', async () => {
        const { result } = renderHook(() => useLocation());

        await act(async () => {
            await result.current.startTracking();
        });

        expect(result.current.isTracking).toBe(true);
    });

    it('should stop tracking', async () => {
        const { result } = renderHook(() => useLocation());

        await act(async () => {
            await result.current.startTracking();
            result.current.stopTracking();
        });

        expect(result.current.isTracking).toBe(false);
    });
});
