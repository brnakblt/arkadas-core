import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'jwt_token';
const USER_KEY = 'user_data';

// Web fallback using localStorage
const webStorage = {
  async getItemAsync(key: string): Promise<string | null> {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem(key);
    }
    return null;
  },
  async setItemAsync(key: string, value: string): Promise<void> {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(key, value);
    }
  },
  async deleteItemAsync(key: string): Promise<void> {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(key);
    }
  }
};

// Use SecureStore on native, localStorage on web
const storage = Platform.OS === 'web' ? webStorage : SecureStore;

export const authService = {
  async saveToken(token: string) {
    await storage.setItemAsync(TOKEN_KEY, token);
  },

  async getToken(): Promise<string | null> {
    return await storage.getItemAsync(TOKEN_KEY);
  },

  async clearToken() {
    await storage.deleteItemAsync(TOKEN_KEY);
  },

  async saveUser(user: any) {
    await storage.setItemAsync(USER_KEY, JSON.stringify(user));
  },

  async getUser(): Promise<any | null> {
    const userStr = await storage.getItemAsync(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  },

  async clearUser() {
    await storage.deleteItemAsync(USER_KEY);
  },

  async logout() {
    await this.clearToken();
    await this.clearUser();
  }
};
