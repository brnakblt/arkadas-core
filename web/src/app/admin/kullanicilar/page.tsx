'use client';

import { useState, useEffect } from 'react';
import UserTable from '@/components/admin/UserTable';
import UserFilters from '@/components/admin/UserFilters';
import UserModal from '@/components/admin/UserModal';

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

// Mock data
const MOCK_USERS: User[] = [
    { id: '1', username: 'admin', email: 'admin@arkadas.edu.tr', fullName: 'Sistem Yöneticisi', role: 'super_admin', status: 'active', createdAt: '2024-01-01', lastLogin: '2024-12-12T10:00:00' },
    { id: '2', username: 'ogretmen1', email: 'ayse@arkadas.edu.tr', fullName: 'Ayşe Yılmaz', role: 'teacher', status: 'active', phone: '0532 111 2233', createdAt: '2024-03-15', lastLogin: '2024-12-12T08:30:00' },
    { id: '3', username: 'terapist1', email: 'mehmet@arkadas.edu.tr', fullName: 'Mehmet Demir', role: 'therapist', status: 'active', phone: '0533 222 3344', createdAt: '2024-04-01', lastLogin: '2024-12-11T16:00:00' },
    { id: '4', username: 'sofor1', email: 'ali@arkadas.edu.tr', fullName: 'Ali Kaya', role: 'driver', status: 'active', phone: '0534 333 4455', createdAt: '2024-05-10' },
    { id: '5', username: 'veli1', email: 'fatma@gmail.com', fullName: 'Fatma Arslan', role: 'parent', status: 'active', phone: '0535 444 5566', createdAt: '2024-06-20', lastLogin: '2024-12-10T09:00:00' },
    { id: '6', username: 'veli2', email: 'hasan@gmail.com', fullName: 'Hasan Öztürk', role: 'parent', status: 'pending', phone: '0536 555 6677', createdAt: '2024-12-01' },
    { id: '7', username: 'ogretmen2', email: 'zeynep@arkadas.edu.tr', fullName: 'Zeynep Şahin', role: 'teacher', status: 'inactive', createdAt: '2024-02-01' },
];

export default function UserManagementPage() {
    const [users, setUsers] = useState<User[]>(MOCK_USERS);
    const [filteredUsers, setFilteredUsers] = useState<User[]>(MOCK_USERS);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('view');

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

    // Apply filters
    useEffect(() => {
        let filtered = users;

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(u =>
                u.fullName.toLowerCase().includes(query) ||
                u.email.toLowerCase().includes(query) ||
                u.username.toLowerCase().includes(query)
            );
        }

        if (roleFilter !== 'all') {
            filtered = filtered.filter(u => u.role === roleFilter);
        }

        if (statusFilter !== 'all') {
            filtered = filtered.filter(u => u.status === statusFilter);
        }

        setFilteredUsers(filtered);
    }, [users, searchQuery, roleFilter, statusFilter]);

    const handleCreateUser = () => {
        setSelectedUser(null);
        setModalMode('create');
        setIsModalOpen(true);
    };

    const handleEditUser = (user: User) => {
        setSelectedUser(user);
        setModalMode('edit');
        setIsModalOpen(true);
    };

    const handleViewUser = (user: User) => {
        setSelectedUser(user);
        setModalMode('view');
        setIsModalOpen(true);
    };

    const handleSaveUser = (userData: Partial<User>) => {
        if (modalMode === 'create') {
            const newUser: User = {
                id: Date.now().toString(),
                username: userData.username || '',
                email: userData.email || '',
                fullName: userData.fullName || '',
                role: userData.role || 'parent',
                status: 'pending',
                phone: userData.phone,
                createdAt: new Date().toISOString().split('T')[0],
            };
            setUsers([...users, newUser]);
        } else if (modalMode === 'edit' && selectedUser) {
            setUsers(users.map(u =>
                u.id === selectedUser.id ? { ...u, ...userData } : u
            ));
        }
        setIsModalOpen(false);
    };

    const handleDeleteUser = (userId: string) => {
        if (confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz?')) {
            setUsers(users.filter(u => u.id !== userId));
        }
    };

    const handleToggleStatus = (userId: string) => {
        setUsers(users.map(u => {
            if (u.id === userId) {
                return {
                    ...u,
                    status: u.status === 'active' ? 'inactive' : 'active',
                };
            }
            return u;
        }));
    };

    const stats = {
        total: users.length,
        active: users.filter(u => u.status === 'active').length,
        pending: users.filter(u => u.status === 'pending').length,
        teachers: users.filter(u => u.role === 'teacher').length,
        parents: users.filter(u => u.role === 'parent').length,
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">👥 Kullanıcı Yönetimi</h1>
                            <p className="text-gray-500 text-sm mt-1">Sistem kullanıcılarını yönetin</p>
                        </div>
                        <button
                            onClick={handleCreateUser}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                        >
                            ➕ Yeni Kullanıcı
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                    <div className="bg-white rounded-xl p-4 shadow-sm">
                        <p className="text-gray-500 text-sm">Toplam</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                    </div>
                    <div className="bg-green-50 rounded-xl p-4">
                        <p className="text-green-600 text-sm">Aktif</p>
                        <p className="text-2xl font-bold text-green-700">{stats.active}</p>
                    </div>
                    <div className="bg-yellow-50 rounded-xl p-4">
                        <p className="text-yellow-600 text-sm">Bekleyen</p>
                        <p className="text-2xl font-bold text-yellow-700">{stats.pending}</p>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-4">
                        <p className="text-blue-600 text-sm">Öğretmen</p>
                        <p className="text-2xl font-bold text-blue-700">{stats.teachers}</p>
                    </div>
                    <div className="bg-purple-50 rounded-xl p-4">
                        <p className="text-purple-600 text-sm">Veli</p>
                        <p className="text-2xl font-bold text-purple-700">{stats.parents}</p>
                    </div>
                </div>

                {/* Filters */}
                <UserFilters
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    roleFilter={roleFilter}
                    onRoleChange={setRoleFilter}
                    statusFilter={statusFilter}
                    onStatusChange={setStatusFilter}
                />

                {/* User Table */}
                <UserTable
                    users={filteredUsers}
                    onView={handleViewUser}
                    onEdit={handleEditUser}
                    onDelete={handleDeleteUser}
                    onToggleStatus={handleToggleStatus}
                />
            </div>

            {/* User Modal */}
            {isModalOpen && (
                <UserModal
                    user={selectedUser}
                    mode={modalMode}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveUser}
                />
            )}
        </div>
    );
}
