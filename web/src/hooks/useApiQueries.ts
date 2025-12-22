import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

// ============================================================
// Generic API Fetch Function
// ============================================================

interface FetchOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: unknown;
    token?: string;
}

async function apiFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    const { method = 'GET', body, token } = options;

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${STRAPI_URL}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error?.message || `HTTP ${response.status}`);
    }

    return response.json();
}

// ============================================================
// User Hooks
// ============================================================

interface User {
    id: number;
    username: string;
    email: string;
    role: { name: string };
}

export function useUsers() {
    return useQuery({
        queryKey: ['users'],
        queryFn: () => apiFetch<{ data: User[] }>('/api/users'),
    });
}

export function useUser(id: number) {
    return useQuery({
        queryKey: ['users', id],
        queryFn: () => apiFetch<User>(`/api/users/${id}`),
        enabled: !!id,
    });
}

export function useCreateUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: Partial<User>) =>
            apiFetch<User>('/api/users', { method: 'POST', body: data }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
    });
}

export function useUpdateUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: Partial<User> }) =>
            apiFetch<User>(`/api/users/${id}`, { method: 'PUT', body: data }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
    });
}

export function useDeleteUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) =>
            apiFetch(`/api/users/${id}`, { method: 'DELETE' }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
    });
}

// ============================================================
// Student Profile Hooks
// ============================================================

interface StudentProfile {
    id: number;
    documentId: string;
    fullName: string;
    dateOfBirth: string;
    gender: string;
}

export function useStudentProfiles() {
    return useQuery({
        queryKey: ['student-profiles'],
        queryFn: () => apiFetch<{ data: StudentProfile[] }>('/api/student-profiles'),
    });
}

export function useStudentProfile(id: string) {
    return useQuery({
        queryKey: ['student-profiles', id],
        queryFn: () => apiFetch<{ data: StudentProfile }>(`/api/student-profiles/${id}`),
        enabled: !!id,
    });
}

// ============================================================
// Attendance Hooks
// ============================================================

interface AttendanceLog {
    id: number;
    documentId: string;
    checkIn: string;
    checkOut?: string;
    status: string;
}

export function useAttendanceLogs(date?: string) {
    return useQuery({
        queryKey: ['attendance-logs', date],
        queryFn: () => {
            const params = date ? `?filters[date][$eq]=${date}` : '';
            return apiFetch<{ data: AttendanceLog[] }>(`/api/attendance-logs${params}`);
        },
    });
}

export function useCreateAttendance() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: Partial<AttendanceLog>) =>
            apiFetch<{ data: AttendanceLog }>('/api/attendance-logs', { method: 'POST', body: { data } }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['attendance-logs'] });
        },
    });
}

// ============================================================
// Schedule Hooks
// ============================================================

interface Schedule {
    id: number;
    documentId: string;
    title: string;
    type: string;
    startTime: string;
    endTime: string;
}

export function useSchedules(startDate?: string, endDate?: string) {
    return useQuery({
        queryKey: ['schedules', startDate, endDate],
        queryFn: () => {
            let params = '';
            if (startDate && endDate) {
                params = `?filters[date][$gte]=${startDate}&filters[date][$lte]=${endDate}`;
            }
            return apiFetch<{ data: Schedule[] }>(`/api/schedules${params}`);
        },
    });
}

// ============================================================
// Service Route Hooks
// ============================================================

interface ServiceRoute {
    id: number;
    documentId: string;
    name: string;
    isActive: boolean;
}

export function useServiceRoutes() {
    return useQuery({
        queryKey: ['service-routes'],
        queryFn: () => apiFetch<{ data: ServiceRoute[] }>('/api/service-routes?populate=*'),
    });
}

export function useServiceRoute(id: string) {
    return useQuery({
        queryKey: ['service-routes', id],
        queryFn: () => apiFetch<{ data: ServiceRoute }>(`/api/service-routes/${id}?populate=*`),
        enabled: !!id,
    });
}
