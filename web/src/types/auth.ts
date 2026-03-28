export interface User {
    id: string;
    username: string;
    email: string;
    fullName?: string;
    userType?: 'super_admin' | 'admin' | 'teacher' | 'therapist' | 'driver' | 'parent' | 'student';
    role?: {
        id: string;
        type: string;
        name: string;
    };
    blocked?: boolean;
    confirmed?: boolean;
    phone?: string;
    createdAt?: string;
    updatedAt?: string;
    avatarUrl?: string;
}

export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}
