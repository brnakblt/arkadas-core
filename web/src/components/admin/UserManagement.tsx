"use client";

import { useState } from 'react';
import useSWR, { mutate } from 'swr';
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

const fetcher = (url: string) => authFetch<any>(url);

export default function UserManagement() {
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

    const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view' | null>(null);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    // Fetch Roles to map ID <-> Name
    const { data: rolesData } = useSWR('/api/users-permissions/roles', fetcher);
    const rolesMap = rolesData?.roles?.reduce((acc: Record<string, string>, r: { type: string; id: string }) => ({ ...acc, [r.type]: r.id }), {}) || {};

    // Fetch Users
    const { data: usersData, isLoading } = useSWR(
        `/api/users?populate=role&sort=createdAt:desc`,
        fetcher
    );

    const users: User[] = usersData?.map((u: any) => ({
        id: u.id,
        username: u.username,
        email: u.email,
        fullName: u.fullName || u.username,
        role: u.role?.type || 'student',
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

    const handleSave = async (userData: Partial<User> & { password?: string }) => {
        try {
            if (modalMode === 'create') {
                const roleId = rolesMap[userData.role || 'student'];
                await authFetch('/api/users', {
                    method: 'POST',
                    body: JSON.stringify({
                        ...userData,
                        role: roleId,
                        confirmed: true,
                        blocked: false,
                        provider: 'local'
                    }),
                });
            } else if (modalMode === 'edit' && selectedUser) {
                // Determine if we need to send role ID
                const updatePayload: any = { ...userData };
                if (userData.role) {
                    updatePayload.role = rolesMap[userData.role];
                }

                await authFetch(`/api/users/${selectedUser.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(updatePayload),
                });
            }
            mutate('/api/users?populate=role&sort=createdAt:desc');
            setModalMode(null);
            setSelectedUser(null);
        } catch (err: any) {
            console.error(err);
            alert(`İşlem başarısız: ${err.message}`);
        }
    };

    const handleDelete = async (userId: string) => {
        if (!confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) return;
        try {
            await authFetch(`/api/users/${userId}`, { method: 'DELETE' });
            mutate('/api/users?populate=role&sort=createdAt:desc');
        } catch (err: any) {
            alert(`Silme başarısız: ${err.message}`);
        }
    };

    const handleToggleStatus = async (userId: string) => {
        const user = users.find(u => u.id === userId);
        if (!user) return;

        // Strapi blocked: true = inactive.
        const shouldBlock = user.status === 'active';

        try {
            await authFetch(`/api/users/${userId}`, {
                method: 'PUT',
                body: JSON.stringify({ blocked: shouldBlock }),
            });
            mutate('/api/users?populate=role&sort=createdAt:desc');
        } catch (err: any) {
            alert(`Durum değiştirme başarısız: ${err.message}`);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-800">Kullanıcı Yönetimi</h2>
                <button
                    onClick={() => { setSelectedUser(null); setModalMode('create'); }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
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
