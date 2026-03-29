import * as SecureStore from 'expo-secure-store';

// Assuming local Strapi URL for dev on Android Emulator/iOS Simulator or physical
// In production, this should be read from environment variables or app.json extra config
const API_URL = 'http://192.168.1.100:1337/api'; // Replace with env config later

export const getToken = async () => {
  try {
    return await SecureStore.getItemAsync('jwt_token');
  } catch (error) {
    console.error('Error fetching token:', error);
    return null;
  }
};

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token = await getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error?.message || response.statusText);
  }

  return response.json();
};
