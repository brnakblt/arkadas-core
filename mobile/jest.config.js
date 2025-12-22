/**
 * Jest configuration for React Native Expo
 */
module.exports = {
    preset: 'jest-expo',
    transformIgnorePatterns: [
        'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
    ],
    setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect', './tests/setup.ts'],
    testMatch: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
    },
    collectCoverageFrom: [
        '**/*.{ts,tsx}',
        '!**/node_modules/**',
        '!**/coverage/**',
        '!**/*.config.*',
    ],
    coverageDirectory: 'coverage',
    testEnvironment: 'node',
};
