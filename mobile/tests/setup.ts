import '@testing-library/jest-native/extend-expect';

// Mock expo-location
jest.mock('expo-location', () => ({
    requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
    requestBackgroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
    getForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
    getCurrentPositionAsync: jest.fn().mockResolvedValue({
        coords: {
            latitude: 41.0082,
            longitude: 28.9784,
            accuracy: 10,
            altitude: 100,
            speed: 0,
            heading: 0,
        },
        timestamp: Date.now(),
    }),
    watchPositionAsync: jest.fn().mockImplementation((options, callback) => {
        return { remove: jest.fn() };
    }),
    Accuracy: {
        High: 5,
        Balanced: 3,
    },
    PermissionStatus: {
        GRANTED: 'granted',
        DENIED: 'denied',
        UNDETERMINED: 'undetermined',
    },
}));

// Mock expo-camera
jest.mock('expo-camera', () => ({
    CameraView: 'CameraView',
    useCameraPermissions: jest.fn().mockReturnValue([
        { granted: true },
        jest.fn().mockResolvedValue({ granted: true }),
    ]),
    CameraType: {
        front: 'front',
        back: 'back',
    },
}));

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
    getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
    requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
    getExpoPushTokenAsync: jest.fn().mockResolvedValue({ data: 'ExponentPushToken[xxx]' }),
    setNotificationHandler: jest.fn(),
    setNotificationChannelAsync: jest.fn(),
    addNotificationReceivedListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
    addNotificationResponseReceivedListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
    scheduleNotificationAsync: jest.fn().mockResolvedValue('notification-id'),
    cancelScheduledNotificationAsync: jest.fn(),
    cancelAllScheduledNotificationsAsync: jest.fn(),
    AndroidImportance: {
        MAX: 5,
        HIGH: 4,
    },
}));

// Mock expo-device
jest.mock('expo-device', () => ({
    isDevice: true,
    deviceName: 'Test Device',
}));

// Mock expo-constants
jest.mock('expo-constants', () => ({
    expoConfig: {
        extra: {
            eas: {
                projectId: 'test-project-id',
            },
        },
    },
}));

// Mock react-native-maps
jest.mock('react-native-maps', () => ({
    default: 'MapView',
    Marker: 'Marker',
    Polyline: 'Polyline',
    PROVIDER_GOOGLE: 'google',
}));
