'use client';

/**
 * Admin Tenant Detail Page
 * 
 * Shows tenant details and manages:
 * - Tenant information
 * - MEBBIS credentials
 * - Users assigned to tenant
 * - Students in tenant
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

// ============================================================
// Types
// ============================================================

interface TenantUser {
    id: number;
    documentId: string;
    username: string;
    email: string;
    userType: 'parent' | 'teacher';
    confirmed: boolean;
    blocked: boolean;
    createdAt: string;
}

interface TenantStudent {
    id: number;
    documentId: string;
    firstName: string;
    lastName: string;
    dateOfBirth?: string;
    createdAt: string;
}

interface TenantDetail {
    id: number;
    documentId: string;
    name: string;
    domain: string;
    contactEmail?: string;
    mebbisUsername?: string;
    mebbisPassword?: string;
    createdAt: string;
    updatedAt: string;
    users: TenantUser[];
    students: TenantStudent[];
}

// ============================================================
// Tab Components
// ============================================================

const TabButton: React.FC<{
    active: boolean;
    onClick: () => void;
    label: string;
    count?: number;
}> = ({ active, onClick, label, count }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 font-medium rounded-t-lg transition-colors ${active
                ? 'bg-white dark:bg-gray-800 text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
    >
        {label}
        {count !== undefined && (
            <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${active ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}>
                {count}
            </span>
        )}
    </button>
);

// ============================================================
// Info Section Component
// ============================================================

const InfoSection: React.FC<{ tenant: TenantDetail }> = ({ tenant }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">
                Genel Bilgiler
            </h3>
            <dl className="space-y-2">
                <div className="flex justify-between">
                    <dt className="text-gray-600 dark:text-gray-400">Kurum Adı</dt>
                    <dd className="font-medium text-gray-900 dark:text-white">{tenant.name}</dd>
                </div>
                <div className="flex justify-between">
                    <dt className="text-gray-600 dark:text-gray-400">Domain</dt>
                    <dd className="font-mono text-sm text-gray-900 dark:text-white">{tenant.domain}</dd>
                </div>
                <div className="flex justify-between">
                    <dt className="text-gray-600 dark:text-gray-400">E-posta</dt>
                    <dd className="text-gray-900 dark:text-white">{tenant.contactEmail || '-'}</dd>
                </div>
                <div className="flex justify-between">
                    <dt className="text-gray-600 dark:text-gray-400">Oluşturulma</dt>
                    <dd className="text-gray-900 dark:text-white">
                        {new Date(tenant.createdAt).toLocaleDateString('tr-TR')}
                    </dd>
                </div>
            </dl>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">
                MEBBIS Entegrasyonu
            </h3>
            <dl className="space-y-2">
                <div className="flex justify-between">
                    <dt className="text-gray-600 dark:text-gray-400">Kullanıcı Adı</dt>
                    <dd className="font-mono text-sm text-gray-900 dark:text-white">
                        {tenant.mebbisUsername || '-'}
                    </dd>
                </div>
                <div className="flex justify-between">
                    <dt className="text-gray-600 dark:text-gray-400">Şifre</dt>
                    <dd className="text-gray-900 dark:text-white">
                        {tenant.mebbisPassword ? '••••••••' : '-'}
                    </dd>
                </div>
            </dl>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">
                İstatistikler
            </h3>
            <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">{tenant.users?.length || 0}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Kullanıcı</div>
                </div>
                <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">{tenant.students?.length || 0}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Öğrenci</div>
                </div>
            </div>
        </div>
    </div>
);

// ============================================================
// Users Table Component
// ============================================================

const UsersTable: React.FC<{ users: TenantUser[] }> = ({ users }) => (
    <div className="overflow-x-auto">
        <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
                        Kullanıcı
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
                        E-posta
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
                        Rol
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
                        Durum
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
                        Kayıt Tarihi
                    </th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {users.length === 0 ? (
                    <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                            Henüz kullanıcı eklenmemiş
                        </td>
                    </tr>
                ) : (
                    users.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-bold">
                                        {user.username.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                        {user.username}
                                    </span>
                                </div>
                            </td>
                            <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                                {user.email}
                            </td>
                            <td className="px-4 py-3 text-center">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${user.userType === 'teacher'
                                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                                        : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                    }`}>
                                    {user.userType === 'teacher' ? 'Öğretmen' : 'Veli'}
                                </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                                {user.blocked ? (
                                    <span className="text-red-500">🚫 Engelli</span>
                                ) : user.confirmed ? (
                                    <span className="text-green-500">✓ Aktif</span>
                                ) : (
                                    <span className="text-yellow-500">⏳ Bekliyor</span>
                                )}
                            </td>
                            <td className="px-4 py-3 text-right text-gray-500 dark:text-gray-400 text-sm">
                                {new Date(user.createdAt).toLocaleDateString('tr-TR')}
                            </td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>
    </div>
);

// ============================================================
// Students Table Component
// ============================================================

const StudentsTable: React.FC<{ students: TenantStudent[] }> = ({ students }) => (
    <div className="overflow-x-auto">
        <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
                        Öğrenci
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
                        Doğum Tarihi
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
                        Kayıt Tarihi
                    </th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {students.length === 0 ? (
                    <tr>
                        <td colSpan={3} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                            Henüz öğrenci eklenmemiş
                        </td>
                    </tr>
                ) : (
                    students.map((student) => (
                        <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-sm font-bold">
                                        {student.firstName.charAt(0)}
                                    </div>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                        {student.firstName} {student.lastName}
                                    </span>
                                </div>
                            </td>
                            <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-300">
                                {student.dateOfBirth
                                    ? new Date(student.dateOfBirth).toLocaleDateString('tr-TR')
                                    : '-'}
                            </td>
                            <td className="px-4 py-3 text-right text-gray-500 dark:text-gray-400 text-sm">
                                {new Date(student.createdAt).toLocaleDateString('tr-TR')}
                            </td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>
    </div>
);

// ============================================================
// Main Page Component
// ============================================================

export default function TenantDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [tenant, setTenant] = useState<TenantDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'info' | 'users' | 'students'>('info');

    const fetchTenant = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/admin/tenants/${params.id}`);
            if (!response.ok) {
                throw new Error('Kurum bulunamadı');
            }
            const data = await response.json();
            setTenant(data.tenant);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Bir hata oluştu');
        } finally {
            setLoading(false);
        }
    }, [params.id]);

    useEffect(() => {
        if (params.id) {
            fetchTenant();
        }
    }, [params.id, fetchTenant]);

    if (loading) {
        return (
            <div className="p-6 flex justify-center items-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error || !tenant) {
        return (
            <div className="p-6">
                <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-6 rounded-lg text-center">
                    <h2 className="text-xl font-bold mb-2">Hata</h2>
                    <p>{error || 'Kurum bulunamadı'}</p>
                    <button
                        onClick={() => router.push('/admin/tenants')}
                        className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                        Geri Dön
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <Link
                    href="/admin/tenants"
                    className="text-blue-600 hover:text-blue-700 flex items-center gap-1 mb-4"
                >
                    ← Kurumlara Dön
                </Link>

                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                        {tenant.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {tenant.name}
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 font-mono text-sm">
                            {tenant.domain}
                        </p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
                <div className="flex gap-2">
                    <TabButton
                        active={activeTab === 'info'}
                        onClick={() => setActiveTab('info')}
                        label="Genel Bilgiler"
                    />
                    <TabButton
                        active={activeTab === 'users'}
                        onClick={() => setActiveTab('users')}
                        label="Kullanıcılar"
                        count={tenant.users?.length || 0}
                    />
                    <TabButton
                        active={activeTab === 'students'}
                        onClick={() => setActiveTab('students')}
                        label="Öğrenciler"
                        count={tenant.students?.length || 0}
                    />
                </div>
            </div>

            {/* Tab Content */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                {activeTab === 'info' && <InfoSection tenant={tenant} />}
                {activeTab === 'users' && <UsersTable users={tenant.users || []} />}
                {activeTab === 'students' && <StudentsTable students={tenant.students || []} />}
            </div>
        </div>
    );
}
