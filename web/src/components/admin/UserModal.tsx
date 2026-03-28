'use client';

import { useState, useEffect } from 'react';

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
}

interface UserModalProps {
    user: User | null;
    mode: 'create' | 'edit' | 'view';
    onClose: () => void;
    onSave: (userData: Partial<User>) => void;
}

const ROLES = [
    { value: 'admin', label: 'Yönetici' },
    { value: 'teacher', label: 'Öğretmen' },
    { value: 'therapist', label: 'Terapist' },
    { value: 'driver', label: 'Şoför' },
    { value: 'parent', label: 'Veli' },
    { value: 'student', label: 'Öğrenci' },
];

export default function UserModal({ user, mode, onClose, onSave }: UserModalProps) {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        fullName: '',
        role: 'parent' as User['role'],
        phone: '',
        password: '',
        confirmPassword: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (user && (mode === 'edit' || mode === 'view')) {
            setFormData({
                username: user.username,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
                phone: user.phone || '',
                password: '',
                confirmPassword: '',
            });
        }
    }, [user, mode]);

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.fullName.trim()) {
            newErrors.fullName = 'Ad soyad gerekli';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'E-posta gerekli';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Geçerli bir e-posta girin';
        }

        if (!formData.username.trim()) {
            newErrors.username = 'Kullanıcı adı gerekli';
        }

        if (mode === 'create') {
            if (!formData.password) {
                newErrors.password = 'Şifre gerekli';
            } else if (formData.password.length < 6) {
                newErrors.password = 'Şifre en az 6 karakter olmalı';
            }

            if (formData.password !== formData.confirmPassword) {
                newErrors.confirmPassword = 'Şifreler eşleşmiyor';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (mode === 'view') return;

        if (validateForm()) {
            const { confirmPassword: _confirmPassword, ...userData } = formData;
            onSave(userData);
        }
    };

    const isReadOnly = mode === 'view';

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                {/* Header */}
                <div className="px-6 py-4 border-b flex items-center justify-between sticky top-0 bg-white">
                    <h2 className="text-xl font-bold text-gray-900">
                        {mode === 'create' && '➕ Yeni Kullanıcı'}
                        {mode === 'edit' && '✏️ Kullanıcı Düzenle'}
                        {mode === 'view' && '👤 Kullanıcı Detayı'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 text-2xl"
                    >
                        ✕
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Full Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Ad Soyad *
                        </label>
                        <input
                            type="text"
                            value={formData.fullName}
                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            disabled={isReadOnly}
                            className={`w-full px-4 py-2.5 border rounded-lg focus:ring-primary/20 focus:border-primary ${errors.fullName ? 'border-red-500' : 'border-gray-300'
                                } ${isReadOnly ? 'bg-gray-50' : ''}`}
                            placeholder="Örn: Ahmet Yılmaz"
                        />
                        {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            E-posta *
                        </label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            disabled={isReadOnly}
                            className={`w-full px-4 py-2.5 border rounded-lg focus:ring-primary/20 focus:border-primary ${errors.email ? 'border-red-500' : 'border-gray-300'
                                } ${isReadOnly ? 'bg-gray-50' : ''}`}
                            placeholder="ornek@email.com"
                        />
                        {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                    </div>

                    {/* Username */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Kullanıcı Adı *
                        </label>
                        <input
                            type="text"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            disabled={isReadOnly}
                            className={`w-full px-4 py-2.5 border rounded-lg focus:ring-primary/20 focus:border-primary ${errors.username ? 'border-red-500' : 'border-gray-300'
                                } ${isReadOnly ? 'bg-gray-50' : ''}`}
                            placeholder="kullaniciadi"
                        />
                        {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username}</p>}
                    </div>

                    {/* Role */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Rol *
                        </label>
                        <select
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value as User['role'] })}
                            disabled={isReadOnly}
                            className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-primary/20 focus:border-primary ${isReadOnly ? 'bg-gray-50' : 'bg-white'
                                }`}
                        >
                            {ROLES.map(role => (
                                <option key={role.value} value={role.value}>
                                    {role.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Phone */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Telefon
                        </label>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            disabled={isReadOnly}
                            className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-primary/20 focus:border-primary ${isReadOnly ? 'bg-gray-50' : ''
                                }`}
                            placeholder="0532 123 4567"
                        />
                    </div>

                    {/* Password (only for create) */}
                    {mode === 'create' && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Şifre *
                                </label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-primary/20 focus:border-primary ${errors.password ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="En az 6 karakter"
                                />
                                {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Şifre Tekrar *
                                </label>
                                <input
                                    type="password"
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-primary/20 focus:border-primary ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="Şifreyi tekrar girin"
                                />
                                {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
                            </div>
                        </>
                    )}

                    {/* View Mode Info */}
                    {mode === 'view' && user && (
                        <div className="pt-4 border-t space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Durum:</span>
                                <span className={`font-medium ${user.status === 'active' ? 'text-green-600' :
                                        user.status === 'pending' ? 'text-yellow-600' : 'text-gray-500'
                                    }`}>
                                    {user.status === 'active' ? 'Aktif' : user.status === 'pending' ? 'Beklemede' : 'Pasif'}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Kayıt Tarihi:</span>
                                <span className="text-gray-900">{new Date(user.createdAt).toLocaleDateString('tr-TR')}</span>
                            </div>
                            {user.lastLogin && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Son Giriş:</span>
                                    <span className="text-gray-900">{new Date(user.lastLogin).toLocaleString('tr-TR')}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                        >
                            {isReadOnly ? 'Kapat' : 'İptal'}
                        </button>
                        {!isReadOnly && (
                            <button
                                type="submit"
                                className="flex-1 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-all font-bold shadow-lg shadow-primary/10 active:scale-95 transform"
                            >
                                {mode === 'create' ? 'Oluştur' : 'Kaydet'}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}
