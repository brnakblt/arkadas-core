import { create } from 'zustand';
import { authService } from '../lib/auth';

interface AuthState {
  user: any | null;
  token: string | null;
  isLoading: boolean;
  setUser: (user: any, token: string) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,

  setUser: async (user, token) => {
    await authService.saveToken(token);
    await authService.saveUser(user);
    set({ user, token });
  },

  logout: async () => {
    await authService.logout();
    set({ user: null, token: null });
  },

  restoreSession: async () => {
    try {
      set({ isLoading: true });
      const token = await authService.getToken();
      const user = await authService.getUser();
      if (token && user) {
        set({ user, token });
      }
    } catch (e) {
      console.error('Session restore failed:', e);
    } finally {
      set({ isLoading: false });
    }
  },
}));
