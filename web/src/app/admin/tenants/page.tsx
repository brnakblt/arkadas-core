'use client';

/**
 * Admin Tenant Management Page
 * 
 * CRUD interface for managing tenants (kurumlar)
 * Features: List, Add, Edit, Delete tenants
 */

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

// ============================================================
// Types
// ============================================================

interface Tenant {
    id: number;
    documentId: string;
    name: string;
    domain: string;
    contactEmail?: string;
    usersCount: number;
    studentsCount: number;
    createdAt: string;
}

interface TenantFormData {
    name: string;
    domain: string;
    contactEmail: string;
    mebbisUsername: string;
    mebbisPassword: string;
}

// ============================================================
// Modal Component
// ============================================================

const TenantModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: TenantFormData) => Promise<void>;
    initialData?: Partial<TenantFormData>;
    title: string;
}> = ({ isOpen, onClose, onSubmit, initialData, title }) => {
    const [formData, setFormData] = useState<TenantFormData>({
        name: initialData?.name || '',
        domain: initialData?.domain || '',
        contactEmail: initialData?.contactEmail || '',
        mebbisUsername: initialData?.mebbisUsername || '',
        mebbisPassword: initialData?.mebbisPassword || '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || '',
                domain: initialData.domain || '',
                contactEmail: initialData.contactEmail || '',
                mebbisUsername: initialData.mebbisUsername || '',
                mebbisPassword: initialData.mebbisPassword || '',
            });
        }
    }, [initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await onSubmit(formData);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-6">
                <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">{title}</h2>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Kurum Adı *
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Domain *
                        </label>
                        <input
                            type="text"
                            value={formData.domain}
                            onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                            placeholder="kurum.arkadaserp.com"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            İletişim E-posta
                        </label>
                        <input
                            type="email"
                            value={formData.contactEmail}
                            onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                        <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">
                            MEBBIS Entegrasyonu
                        </h3>

                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    MEBBIS Kullanıcı Adı
                                </label>
                                <input
                                    type="text"
                                    value={formData.mebbisUsername}
                                    onChange={(e) => setFormData({ ...formData, mebbisUsername: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    MEBBIS Şifre
                                </label>
                                <input
                                    type="password"
                                    value={formData.mebbisPassword}
                                    onChange={(e) => setFormData({ ...formData, mebbisPassword: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                            {loading ? 'Kaydediliyor...' : 'Kaydet'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ============================================================
// Delete Confirmation Modal
// ============================================================

const DeleteConfirmModal: React.FC<{
    isOpen: boolean;
    tenantName: string;
    onClose: () => void;
    onConfirm: () => Promise<void>;
}> = ({ isOpen, tenantName, onClose, onConfirm }) => {
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        setLoading(true);
        await onConfirm();
        setLoading(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-6">
                <h2 className="text-xl font-bold mb-4 text-red-600">Kurumu Sil</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                    <strong>{tenantName}</strong> kurumunu silmek istediğinize emin misiniz?
                    Bu işlem geri alınamaz ve kuruma ait tüm veriler silinecektir.
                </p>
                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        İptal
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={loading}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                    >
                        {loading ? 'Siliniyor...' : 'Evet, Sil'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ============================================================
// Main Page Component
// ============================================================

export default function TenantsPage() {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Modal states
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
    const [deletingTenant, setDeletingTenant] = useState<Tenant | null>(null);

    // Fetch tenants
    const fetchTenants = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/admin/tenants');
            if (!response.ok) {
                throw new Error('Kurumlar yüklenemedi');
            }
            const data = await response.json();
            setTenants(data.tenants || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Bir hata oluştu');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTenants();
    }, [fetchTenants]);

    // Create tenant
    const handleCreate = async (data: TenantFormData) => {
        const response = await fetch('/api/admin/tenants', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Kurum oluşturulamadı');
        }
        await fetchTenants();
    };

    // Update tenant
    const handleUpdate = async (data: TenantFormData) => {
        if (!editingTenant) return;
        const response = await fetch(`/api/admin/tenants/${editingTenant.documentId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Kurum güncellenemedi');
        }
        setEditingTenant(null);
        await fetchTenants();
    };

    // Delete tenant
    const handleDelete = async () => {
        if (!deletingTenant) return;
        const response = await fetch(`/api/admin/tenants/${deletingTenant.documentId}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Kurum silinemedi');
        }
        setDeletingTenant(null);
        await fetchTenants();
    };

    // Filter tenants
    const filteredTenants = tenants.filter(
        (t) =>
            t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.domain.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Kurum Yönetimi
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Tenant bazlı kurum ekleme, düzenleme ve silme
                    </p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
                >
                    <span className="text-lg">+</span>
                    Yeni Kurum
                </button>
            </div>

            {/* Search */}
            <div className="mb-6">
                <input
                    type="text"
                    placeholder="Kurum ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full max-w-md px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {/* Error State */}
            {error && (
                <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg">
                    {error}
                </div>
            )}

            {/* Loading State */}
            {loading && (
                <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            )}

            {/* Tenants Table */}
            {!loading && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                    Kurum
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                    Domain
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                    Kullanıcılar
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                    Öğrenciler
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                    İşlemler
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredTenants.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                        {searchQuery ? 'Arama sonucu bulunamadı' : 'Henüz kurum eklenmemiş'}
                                    </td>
                                </tr>
                            ) : (
                                filteredTenants.map((tenant) => (
                                    <tr key={tenant.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                                    {tenant.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <Link
                                                        href={`/admin/tenants/${tenant.documentId}`}
                                                        className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
                                                    >
                                                        {tenant.name}
                                                    </Link>
                                                    {tenant.contactEmail && (
                                                        <div className="text-sm text-gray-500 dark:text-gray-400">
                                                            {tenant.contactEmail}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-gray-600 dark:text-gray-300 font-mono">
                                                {tenant.domain}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                                                {tenant.usersCount}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                                                {tenant.studentsCount}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => setEditingTenant(tenant)}
                                                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                    title="Düzenle"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    onClick={() => setDeletingTenant(tenant)}
                                                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                    title="Sil"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Stats Footer */}
            {!loading && tenants.length > 0 && (
                <div className="mt-6 flex gap-6 text-sm text-gray-500 dark:text-gray-400">
                    <span>Toplam: <strong>{tenants.length}</strong> kurum</span>
                    <span>Toplam Kullanıcı: <strong>{tenants.reduce((sum, t) => sum + t.usersCount, 0)}</strong></span>
                    <span>Toplam Öğrenci: <strong>{tenants.reduce((sum, t) => sum + t.studentsCount, 0)}</strong></span>
                </div>
            )}

            {/* Modals */}
            <TenantModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSubmit={handleCreate}
                title="Yeni Kurum Ekle"
            />

            <TenantModal
                isOpen={!!editingTenant}
                onClose={() => setEditingTenant(null)}
                onSubmit={handleUpdate}
                initialData={editingTenant || undefined}
                title="Kurumu Düzenle"
            />

            <DeleteConfirmModal
                isOpen={!!deletingTenant}
                tenantName={deletingTenant?.name || ''}
                onClose={() => setDeletingTenant(null)}
                onConfirm={handleDelete}
            />
        </div>
    );
}
