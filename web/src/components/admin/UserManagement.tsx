"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import UserTable from './UserTable';
import UserModal from './UserModal';
import UserFilters from './UserFilters';
import { authFetch } from '@/lib/auth';

interface User {
    id: string;
    username: string;
    email: string;
    fullName: string;
    role: 'super_admin' | 'admin' | 'teacher' | 'therapist' | 'driver' | 'parent' | 'student';
    status: 'active' | 'inactive' | 'pending';
    phone?: string;
    createdAt: string;
    lastLogin?: string;
    avatar?: string;
}

interface StrapiRole {
    id: string;
    type: string;
    name: string;
}

interface StrapiUser {
    id: string;
    username: string;
    email: string;
    fullName?: string;
    role?: StrapiRole;
    blocked: boolean;
    confirmed: boolean;
    phone?: string;
    createdAt: string;
    updatedAt: string;
}

interface RolesResponse {
    roles: StrapiRole[];
}

interface SaveUserData extends Partial<User> {
    password?: string;
    blocked?: boolean;
}

const fetcher = <T,>(url: string) => authFetch<T>(url);

export default function UserManagement() {
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

    const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view' | null>(null);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    const queryClient = useQueryClient();

    // Fetch Roles to map ID <-> Name
    const { data: rolesData } = useQuery<RolesResponse>({
        queryKey: ['roles'],
        queryFn: () => fetcher<RolesResponse>('/api/users-permissions/roles')
    });
    const rolesMap = rolesData?.roles?.reduce((acc: Record<string, string>, r: StrapiRole) => ({ ...acc, [r.type]: r.id }), {}) || {};

    // Fetch Users
    const { data: usersData, isLoading } = useQuery<StrapiUser[]>({
        queryKey: ['users'],
        queryFn: () => fetcher<StrapiUser[]>('/api/users?populate=role&sort=createdAt:desc')
    });

    const users: User[] = usersData?.map((u: StrapiUser) => ({
        id: u.id,
        username: u.username,
        email: u.email,
        fullName: u.fullName || u.username,
        role: (u.role?.type as User['role']) || 'student',
        status: u.blocked ? 'inactive' : (u.confirmed ? 'active' : 'pending'),
        phone: u.phone,
        createdAt: u.createdAt,
        lastLogin: u.updatedAt,
    })) || [];

    const filteredUsers = users.filter(user => {
        const matchesSearch =
            user.fullName.toLowerCase().includes(search.toLowerCase()) ||
            user.email.toLowerCase().includes(search.toLowerCase()) ||
            user.username.toLowerCase().includes(search.toLowerCase());

        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        const matchesStatus = statusFilter === 'all' || user.status === statusFilter;

        return matchesSearch && matchesRole && matchesStatus;
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: async (userData: SaveUserData) => {
            const roleId = rolesMap[userData.role || 'student'];
            return authFetch('/api/users', {
                method: 'POST',
                body: JSON.stringify({
                    ...userData,
                    role: roleId,
                    confirmed: true,
                    blocked: false,
                    provider: 'local'
                }),
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setModalMode(null);
            setSelectedUser(null);
        },
        onError: (err: Error) => {
            const message = err.message || 'Bilinmeyen bir hata oluştu';
            alert(`İşlem başarısız: ${message}`);
        }
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string, data: SaveUserData }) => {
            const updatePayload: Record<string, unknown> = { ...data };
            if (data.role) {
                updatePayload.role = rolesMap[data.role];
            }
            return authFetch(`/api/users/${id}`, {
                method: 'PUT',
                body: JSON.stringify(updatePayload),
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setModalMode(null);
            setSelectedUser(null);
        },
        onError: (err: Error) => {
            const message = err.message || 'Bilinmeyen bir hata oluştu';
            alert(`İşlem başarısız: ${message}`);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (userId: string) => {
            return authFetch(`/api/users/${userId}`, { method: 'DELETE' });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
        onError: (err: Error) => {
            const message = err.message || 'Bilinmeyen bir hata oluştu';
            alert(`Silme başarısız: ${message}`);
        }
    });

    const handleSave = async (userData: SaveUserData) => {
        if (modalMode === 'create') {
            createMutation.mutate(userData);
        } else if (modalMode === 'edit' && selectedUser) {
            updateMutation.mutate({ id: selectedUser.id, data: userData });
        }
    };

    const handleDelete = async (userId: string) => {
        if (!confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) return;
        deleteMutation.mutate(userId);
    };

    const handleToggleStatus = async (userId: string) => {
        const user = users.find(u => u.id === userId);
        if (!user) return;

        // Strapi blocked: true = inactive.
        const shouldBlock = user.status === 'active';
        updateMutation.mutate({ id: userId, data: { blocked: shouldBlock } });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">Kullanıcı Yönetimi</h2>
                <button
                    onClick={() => { setSelectedUser(null); setModalMode('create'); }}
                    className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-all flex items-center gap-2 shadow-lg shadow-primary/10 font-bold transform active:scale-95"
                >
                    <span>➕</span> Yeni Kullanıcı
                </button>
            </div>

            <UserFilters
                searchQuery={search} onSearchChange={setSearch}
                roleFilter={roleFilter} onRoleChange={setRoleFilter}
                statusFilter={statusFilter} onStatusChange={setStatusFilter}
            />

            {isLoading ? (
                <div className="text-center py-12 text-gray-500">
                    <span className="animate-spin inline-block mr-2">⏳</span> Yükleniyor...
                </div>
            ) : (
                <UserTable
                    users={filteredUsers}
                    onView={(user) => { setSelectedUser(user); setModalMode('view'); }}
                    onEdit={(user) => { setSelectedUser(user); setModalMode('edit'); }}
                    onDelete={(id) => handleDelete(id)}
                    onToggleStatus={(id) => handleToggleStatus(id)}
                />
            )}

            {modalMode && (
                <UserModal
                    user={selectedUser}
                    mode={modalMode}
                    onClose={() => setModalMode(null)}
                    onSave={handleSave}
                />
            )}
        </div>
    );
}
