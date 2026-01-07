/**
 * Authentication Service
 * JWT token management, auth state, and API authentication
 */

// ============================================================
// Types
// ============================================================

interface User {
    id: number;
    username: string;
    email: string;
    role: {
        id: number;
        name: string;
        type: string;
    };
    studentProfile?: { id: number };
    teacherProfile?: { id: number };
}

interface AuthResponse {
    jwt: string;
    user: User;
}

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}

// ============================================================
// Token Storage
// ============================================================

const TOKEN_KEY = 'erp_auth_token';
const USER_KEY = 'erp_auth_user';

export const tokenStorage = {
    getToken(): string | null {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem(TOKEN_KEY);
    },

    setToken(token: string): void {
        if (typeof window === 'undefined') return;
        localStorage.setItem(TOKEN_KEY, token);
    },

    removeToken(): void {
        if (typeof window === 'undefined') return;
        localStorage.removeItem(TOKEN_KEY);
    },

    getUser(): User | null {
        if (typeof window === 'undefined') return null;
        const data = localStorage.getItem(USER_KEY);
        return data ? JSON.parse(data) : null;
    },

    setUser(user: User): void {
        if (typeof window === 'undefined') return;
        localStorage.setItem(USER_KEY, JSON.stringify(user));
    },

    removeUser(): void {
        if (typeof window === 'undefined') return;
        localStorage.removeItem(USER_KEY);
    },

    clear(): void {
        this.removeToken();
        this.removeUser();
    },
};

// ============================================================
// API Client with Auth
// ============================================================

// Point to our local proxy

export async function authFetch<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    // We let the proxy handle Authorization header via cookies

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    // Use /api/proxy prefix for authenticated requests
    const fetchUrl = `/api/proxy${endpoint}`;

    const response = await fetch(fetchUrl, {
        ...options,
        headers,
    });

    if (response.status === 401) {
        tokenStorage.clear();
        if (typeof window !== 'undefined') {
            window.location.href = '/login';
        }
        throw new Error('Oturum süresi doldu');
    }

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error?.message || 'API hatası');
    }

    return response.json();
}

// ============================================================
// Auth API
// ============================================================

export const authApi = {
    /**
     * Login with email/username and password
     */
    async login(identifier: string, password: string): Promise<AuthResponse> {
        // Use our new auth/login route directly
        const response = await fetch(`/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier, password }),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error?.message || 'Giriş başarısız');
        }

        const data: AuthResponse = await response.json();

        // No longer storing token or user in localStorage
        // But keeping user in localStorage might be useful for non-sensitive UI?
        // For consistency with useAuth, let's NOT store it or only store user.
        // The original code stored both.
        // tokenStorage.setToken(data.jwt); <-- REMOVED
        if (data.user) {
            tokenStorage.setUser(data.user);
        }

        return data;
    },

    /**
     * Register new user
     */
    async register(
        username: string,
        email: string,
        password: string
    ): Promise<AuthResponse> {
        // Register relies on public endpoint, but return includes JWT.
        // Ideally we should proxy this to set cookie too.
        // For now, let's assume register -> auto-login is desired.
        // But I don't have a specific register proxy.
        // Let's us direct call but DO NOT store token. User must login?
        // Or create /api/auth/register?
        // Given scope, I will leave register touching Strapi but remove token storage.
        const response = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337'}/api/auth/local/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password }),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error?.message || 'Kayıt başarısız');
        }

        const data: AuthResponse = await response.json();

        // tokenStorage.setToken(data.jwt);
        // tokenStorage.setUser(data.user);

        return data;
    },

    /**
     * Logout - clear tokens
     */
    async logout(): Promise<void> {
        await fetch('/api/auth/logout', { method: 'POST' });
        tokenStorage.clear();
        if (typeof window !== 'undefined') {
            window.location.href = '/login';
        }
    },

    /**
     * Get current user
     */
    async getMe(): Promise<User> {
        return authFetch<User>('/api/users/me?populate=role,studentProfile,teacherProfile');
    },

    /**
     * Refresh user data
     */
    async refreshUser(): Promise<User | null> {
        try {
            const user = await this.getMe();
            tokenStorage.setUser(user);
            return user;
        } catch {
            return null;
        }
    },

    /**
     * Change password
     */
    async changePassword(
        currentPassword: string,
        password: string,
        passwordConfirmation: string
    ): Promise<void> {
        await authFetch('/api/auth/change-password', {
            method: 'POST',
            body: JSON.stringify({ currentPassword, password, passwordConfirmation }),
        });
    },

    /**
     * Request password reset
     */
    async forgotPassword(email: string): Promise<void> {
        await fetch(`${process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337'}/api/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });
    },

    /**
     * Reset password with token
     */
    async resetPassword(
        code: string,
        password: string,
        passwordConfirmation: string
    ): Promise<void> {
        const response = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337'}/api/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, password, passwordConfirmation }),
        });

        if (!response.ok) {
            throw new Error('Şifre sıfırlama başarısız');
        }
    },

    /**
     * Check if user is authenticated
     */
    isAuthenticated(): boolean {
        return !!tokenStorage.getToken();
    },

    /**
     * Get current auth state
     */
    getAuthState(): AuthState {
        const token = tokenStorage.getToken();
        const user = tokenStorage.getUser();

        return {
            user,
            token,
            isAuthenticated: !!token,
            isLoading: false,
        };
    },
};

// ============================================================
// Role-based access control helpers
// ============================================================

export const rbac = {
    hasRole(user: User | null, role: string): boolean {
        return user?.role?.type === role;
    },

    isAdmin(user: User | null): boolean {
        return this.hasRole(user, 'admin') || this.hasRole(user, 'superadmin');
    },

    isTeacher(user: User | null): boolean {
        return this.hasRole(user, 'teacher') || this.isAdmin(user);
    },

    isParent(user: User | null): boolean {
        return this.hasRole(user, 'parent');
    },

    isDriver(user: User | null): boolean {
        return this.hasRole(user, 'driver');
    },

    canAccess(user: User | null, allowedRoles: string[]): boolean {
        if (!user) return false;
        if (this.isAdmin(user)) return true;
        return allowedRoles.includes(user.role?.type);
    },
};

export type { User, AuthResponse, AuthState };
