
import { Platform } from 'react-native';

// Android emulator uses 10.0.2.2 for localhost
const BASE_URL = Platform.OS === 'android'
    ? 'http://10.0.2.2:1337'
    : 'http://localhost:1337'; // iOS emulator or real device (if using tunnel)

export const authService = {
    async login(identifier: string, password: string) {
        try {
            const response = await fetch(`${BASE_URL}/api/auth/local`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    identifier,
                    password,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error?.message || 'Giriş başarısız');
            }

            return data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }
};
