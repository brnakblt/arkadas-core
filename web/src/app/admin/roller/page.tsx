'use client';

/**
 * Roles & Permissions Page
 * Manage user roles and their permissions
 */

import React, { useState } from 'react';

// ============================================================
// Types
// ============================================================

interface Permission {
    id: string;
    name: string;
    description: string;
}

interface Role {
    id: string;
    name: string;
    displayName: string;
    description: string;
    permissions: string[];
    userCount: number;
}

// ============================================================
// Mock Data
// ============================================================

const allPermissions: Permission[] = [
    { id: 'students:read', name: 'Öğrenci Görüntüleme', description: 'Öğrenci bilgilerini görüntüle' },
    { id: 'students:write', name: 'Öğrenci Düzenleme', description: 'Öğrenci bilgilerini düzenle' },
    { id: 'students:delete', name: 'Öğrenci Silme', description: 'Öğrenci kayıtlarını sil' },
    { id: 'attendance:read', name: 'Yoklama Görüntüleme', description: 'Yoklama kayıtlarını görüntüle' },
    { id: 'attendance:write', name: 'Yoklama Kaydetme', description: 'Yoklama kaydet' },
    { id: 'reports:read', name: 'Rapor Görüntüleme', description: 'Raporları görüntüle' },
    { id: 'reports:export', name: 'Rapor Dışa Aktarma', description: 'Raporları dışa aktar' },
    { id: 'settings:read', name: 'Ayar Görüntüleme', description: 'Sistem ayarlarını görüntüle' },
    { id: 'settings:write', name: 'Ayar Düzenleme', description: 'Sistem ayarlarını düzenle' },
    { id: 'users:read', name: 'Kullanıcı Görüntüleme', description: 'Kullanıcıları görüntüle' },
    { id: 'users:write', name: 'Kullanıcı Düzenleme', description: 'Kullanıcıları düzenle' },
    { id: 'users:delete', name: 'Kullanıcı Silme', description: 'Kullanıcıları sil' },
];

const initialRoles: Role[] = [
    {
        id: 'admin',
        name: 'admin',
        displayName: 'Yönetici',
        description: 'Tüm sistem yetkilerine sahip',
        permissions: allPermissions.map((p) => p.id),
        userCount: 2,
    },
    {
        id: 'teacher',
        name: 'teacher',
        displayName: 'Öğretmen',
        description: 'Eğitim ve yoklama yetkileri',
        permissions: ['students:read', 'attendance:read', 'attendance:write', 'reports:read'],
        userCount: 15,
    },
    {
        id: 'parent',
        name: 'parent',
        displayName: 'Veli',
        description: 'Sadece kendi çocuğunun bilgilerine erişim',
        permissions: ['students:read', 'attendance:read', 'reports:read'],
        userCount: 45,
    },
    {
        id: 'driver',
        name: 'driver',
        displayName: 'Şoför',
        description: 'Servis ve yoklama yetkileri',
        permissions: ['students:read', 'attendance:read', 'attendance:write'],
        userCount: 5,
    },
];

// ============================================================
// Page Component
// ============================================================

export default function RolesPage() {
    const [roles, setRoles] = useState<Role[]>(initialRoles);
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);

    const handleTogglePermission = (permissionId: string) => {
        if (!selectedRole) return;

        setRoles((prevRoles) =>
            prevRoles.map((role) => {
                if (role.id !== selectedRole.id) return role;

                const hasPermission = role.permissions.includes(permissionId);
                return {
                    ...role,
                    permissions: hasPermission
                        ? role.permissions.filter((p) => p !== permissionId)
                        : [...role.permissions, permissionId],
                };
            })
        );

        setSelectedRole((prev) => {
            if (!prev) return null;
            const hasPermission = prev.permissions.includes(permissionId);
            return {
                ...prev,
                permissions: hasPermission
                    ? prev.permissions.filter((p) => p !== permissionId)
                    : [...prev.permissions, permissionId],
            };
        });
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <header className="bg-white dark:bg-gray-800 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        🔐 Roller & İzinler
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Kullanıcı rollerini ve erişim izinlerini yönetin
                    </p>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Roles List */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Roller
                        </h2>
                        <div className="space-y-2">
                            {roles.map((role) => (
                                <button
                                    key={role.id}
                                    onClick={() => setSelectedRole(role)}
                                    className={`w-full text-left p-4 rounded-lg transition-colors ${selectedRole?.id === role.id
                                            ? 'bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-500'
                                            : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {role.displayName}
                                        </span>
                                        <span className="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded-full">
                                            {role.userCount} kullanıcı
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        {role.description}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Permissions */}
                    <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                        {selectedRole ? (
                            <>
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                            {selectedRole.displayName} İzinleri
                                        </h2>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {selectedRole.permissions.length} / {allPermissions.length} izin aktif
                                        </p>
                                    </div>
                                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                                        Değişiklikleri Kaydet
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {allPermissions.map((permission) => {
                                        const isActive = selectedRole.permissions.includes(permission.id);
                                        return (
                                            <div
                                                key={permission.id}
                                                className={`p-4 rounded-lg border transition-colors cursor-pointer ${isActive
                                                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                                    }`}
                                                onClick={() => handleTogglePermission(permission.id)}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="font-medium text-gray-900 dark:text-white">
                                                        {permission.name}
                                                    </span>
                                                    <input
                                                        type="checkbox"
                                                        checked={isActive}
                                                        onChange={() => { }}
                                                        className="w-5 h-5 text-green-600 rounded"
                                                    />
                                                </div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                    {permission.description}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                                <div className="text-center">
                                    <span className="text-4xl">👈</span>
                                    <p className="mt-2">İzinleri düzenlemek için bir rol seçin</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
