
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = Platform.OS === 'android'
    ? 'http://10.0.2.2:1337'
    : 'http://localhost:1337';

export const dataService = {
    async getDashboardStats() {
        try {
            const token = await SecureStore.getItemAsync('jwt');
            if (!token) throw new Error("No token found");

            // Fetching students to count them as a proxy for "tasks" or "sessions" for now
            // In a real app, this would hit /api/teacher-dashboard
            const response = await fetch(`${BASE_URL}/api/students`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error("Failed to fetch data");

            const data = await response.json();

            // Simulating teacher-specific data derivation
            return {
                sessionCount: 5, // Hardcoded for demo until Session model
                pendingTasks: data.data ? data.data.length : 0 // Using student count as "tasks"
            };
        } catch (error) {
            console.error("Data Service Error:", error);
            return { sessionCount: 0, pendingTasks: 0 };
        }
    }
};
