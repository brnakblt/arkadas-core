'use client';

/**
 * Admin Settings Page
 * System configuration and settings management
 */

import React, { useState } from 'react';

// ============================================================
// Types
// ============================================================

interface SystemSettings {
    siteName: string;
    siteUrl: string;
    adminEmail: string;
    timezone: string;
    language: string;
    maintenanceMode: boolean;
    allowRegistration: boolean;
    maxLoginAttempts: number;
    sessionTimeout: number;
    notificationEmail: boolean;
    notificationSms: boolean;
    notificationPush: boolean;
}

// ============================================================
// Page Component
// ============================================================

export default function AdminSettingsPage() {
    const [settings, setSettings] = useState<SystemSettings>({
        siteName: 'Arkadaş Özel Eğitim',
        siteUrl: 'https://arkadasozelegitim.com',
        adminEmail: 'admin@arkadasozelegitim.com',
        timezone: 'Europe/Istanbul',
        language: 'tr',
        maintenanceMode: false,
        allowRegistration: false,
        maxLoginAttempts: 5,
        sessionTimeout: 60,
        notificationEmail: true,
        notificationSms: true,
        notificationPush: true,
    });

    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const handleChange = (key: keyof SystemSettings, value: unknown) => {
        setSettings((prev) => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);

        try {
            // In production, save to API
            // await fetch('/api/admin/settings', { method: 'PUT', body: JSON.stringify(settings) });
            await new Promise((resolve) => setTimeout(resolve, 1000));
            setMessage({ type: 'success', text: 'Ayarlar başarıyla kaydedildi' });
        } catch {
            setMessage({ type: 'error', text: 'Ayarlar kaydedilemedi' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <header className="bg-white dark:bg-gray-800 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                ⚙️ Sistem Ayarları
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400 mt-1">
                                Genel sistem yapılandırması
                            </p>
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                            {saving ? 'Kaydediliyor...' : 'Kaydet'}
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Message */}
                {message && (
                    <div
                        className={`mb-6 p-4 rounded-lg ${message.type === 'success'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            }`}
                    >
                        {message.text}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* General Settings */}
                    <SettingsCard title="Genel Ayarlar" icon="🏠">
                        <FormField label="Site Adı">
                            <input
                                type="text"
                                value={settings.siteName}
                                onChange={(e) => handleChange('siteName', e.target.value)}
                                className="form-input"
                            />
                        </FormField>
                        <FormField label="Site URL">
                            <input
                                type="url"
                                value={settings.siteUrl}
                                onChange={(e) => handleChange('siteUrl', e.target.value)}
                                className="form-input"
                            />
                        </FormField>
                        <FormField label="Admin E-posta">
                            <input
                                type="email"
                                value={settings.adminEmail}
                                onChange={(e) => handleChange('adminEmail', e.target.value)}
                                className="form-input"
                            />
                        </FormField>
                        <FormField label="Zaman Dilimi">
                            <select
                                value={settings.timezone}
                                onChange={(e) => handleChange('timezone', e.target.value)}
                                className="form-input"
                            >
                                <option value="Europe/Istanbul">Türkiye (UTC+3)</option>
                                <option value="Europe/London">Londra (UTC+0)</option>
                                <option value="Europe/Berlin">Berlin (UTC+1)</option>
                            </select>
                        </FormField>
                        <FormField label="Dil">
                            <select
                                value={settings.language}
                                onChange={(e) => handleChange('language', e.target.value)}
                                className="form-input"
                            >
                                <option value="tr">Türkçe</option>
                                <option value="en">English</option>
                            </select>
                        </FormField>
                    </SettingsCard>

                    {/* Security Settings */}
                    <SettingsCard title="Güvenlik Ayarları" icon="🔒">
                        <FormField label="Bakım Modu">
                            <ToggleSwitch
                                checked={settings.maintenanceMode}
                                onChange={(v) => handleChange('maintenanceMode', v)}
                            />
                            <span className="text-sm text-gray-500 ml-2">
                                {settings.maintenanceMode ? 'Aktif' : 'Pasif'}
                            </span>
                        </FormField>
                        <FormField label="Yeni Kayıt İzni">
                            <ToggleSwitch
                                checked={settings.allowRegistration}
                                onChange={(v) => handleChange('allowRegistration', v)}
                            />
                        </FormField>
                        <FormField label="Maks. Giriş Denemesi">
                            <input
                                type="number"
                                min={1}
                                max={10}
                                value={settings.maxLoginAttempts}
                                onChange={(e) => handleChange('maxLoginAttempts', parseInt(e.target.value))}
                                className="form-input w-24"
                            />
                        </FormField>
                        <FormField label="Oturum Süresi (dakika)">
                            <input
                                type="number"
                                min={15}
                                max={480}
                                value={settings.sessionTimeout}
                                onChange={(e) => handleChange('sessionTimeout', parseInt(e.target.value))}
                                className="form-input w-24"
                            />
                        </FormField>
                    </SettingsCard>

                    {/* Notification Settings */}
                    <SettingsCard title="Bildirim Ayarları" icon="🔔">
                        <FormField label="E-posta Bildirimleri">
                            <ToggleSwitch
                                checked={settings.notificationEmail}
                                onChange={(v) => handleChange('notificationEmail', v)}
                            />
                        </FormField>
                        <FormField label="SMS Bildirimleri">
                            <ToggleSwitch
                                checked={settings.notificationSms}
                                onChange={(v) => handleChange('notificationSms', v)}
                            />
                        </FormField>
                        <FormField label="Push Bildirimleri">
                            <ToggleSwitch
                                checked={settings.notificationPush}
                                onChange={(v) => handleChange('notificationPush', v)}
                            />
                        </FormField>
                    </SettingsCard>

                    {/* System Info */}
                    <SettingsCard title="Sistem Bilgisi" icon="ℹ️">
                        <InfoRow label="Versiyon" value="1.0.0" />
                        <InfoRow label="Node.js" value="22.x" />
                        <InfoRow label="Next.js" value="15.x" />
                        <InfoRow label="Son Güncelleme" value="2025-12-13" />
                        <InfoRow label="Veritabanı" value="PostgreSQL + SQLite" />
                        <InfoRow label="Cache" value="Redis" />
                    </SettingsCard>
                </div>
            </main>

            <style dangerouslySetInnerHTML={{
                __html: `
          .tox-tinymce { border-radius: 0.5rem !important; }
        `}} />
            <style>{`
        .form-input {
          width: 100%;
          padding: 0.5rem 0.75rem;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          background: white;
          font-size: 0.875rem;
          transition: border-color 0.2s;
        }
        .form-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        .dark .form-input {
          background: #374151;
          border-color: #4b5563;
          color: white;
        }
      `}</style>
        </div>
    );
}

// ============================================================
// Sub-components
// ============================================================

function SettingsCard({
    title,
    icon,
    children,
}: {
    title: string;
    icon: string;
    children: React.ReactNode;
}) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span>{icon}</span>
                {title}
            </h2>
            <div className="space-y-4">{children}</div>
        </div>
    );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 sm:w-40 flex-shrink-0">
                {label}
            </label>
            <div className="flex-1 flex items-center">{children}</div>
        </div>
    );
}

function ToggleSwitch({
    checked,
    onChange,
}: {
    checked: boolean;
    onChange: (value: boolean) => void;
}) {
    return (
        <button
            type="button"
            onClick={() => onChange(!checked)}
            className={`relative w-12 h-6 rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
        >
            <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${checked ? 'left-7' : 'left-1'
                    }`}
            />
        </button>
    );
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
            <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">{value}</span>
        </div>
    );
}
