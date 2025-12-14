'use client';

/**
 * MEBBIS Integration Dashboard
 * UI for managing MEBBIS automation services
 */

import React, { useState } from 'react';

// ============================================================
// Types
// ============================================================

type JobStatus = 'idle' | 'running' | 'success' | 'error';

interface ServiceStatus {
    id: string;
    name: string;
    description: string;
    status: JobStatus;
    lastRun?: string;
    lastResult?: string;
    icon: string;
}

interface SyncJob {
    id: string;
    type: string;
    status: JobStatus;
    progress: number;
    message: string;
    startedAt: string;
}

// ============================================================
// Mock Data
// ============================================================

const initialServices: ServiceStatus[] = [
    {
        id: 'student-sync',
        name: 'Öğrenci Senkronizasyonu',
        description: 'MEBBIS\'teki öğrenci bilgilerini çeker ve yerel veritabanıyla senkronize eder',
        status: 'idle',
        lastRun: '2025-12-13 14:30',
        lastResult: '45 öğrenci senkronize edildi',
        icon: '👥',
    },
    {
        id: 'education-entry',
        name: 'Eğitim Bilgi Girişi',
        description: 'Eğitim bilgilerini otomatik olarak MEBBIS\'e girer',
        status: 'idle',
        lastRun: '2025-12-13 15:00',
        lastResult: '12 kayıt girildi',
        icon: '📚',
    },
    {
        id: 'invoice',
        name: 'Fatura İşlemleri',
        description: 'Fatura oluşturma ve onaylama işlemleri',
        status: 'idle',
        lastRun: '2025-12-12 10:00',
        lastResult: '8 fatura onaylandı',
        icon: '🧾',
    },
    {
        id: 'bep',
        name: 'BEP Form Aktarımı',
        description: 'BEP formlarını (EK-4, EK-5, EK-6) MEBBIS\'e aktarır',
        status: 'idle',
        lastRun: '2025-12-10 09:00',
        lastResult: '15 form aktarıldı',
        icon: '📋',
    },
];

// ============================================================
// Page Component
// ============================================================

export default function MebbisPage() {
    const [services, setServices] = useState<ServiceStatus[]>(initialServices);
    const [activeJob, setActiveJob] = useState<SyncJob | null>(null);
    const [credentials, setCredentials] = useState({ tcNo: '', password: '' });
    const [isConfigured, setIsConfigured] = useState(false);

    const runService = async (serviceId: string) => {
        // Update service status
        setServices((prev) =>
            prev.map((s) => (s.id === serviceId ? { ...s, status: 'running' as JobStatus } : s))
        );

        try {
            let endpoint = '';
            let body = {};

            switch (serviceId) {
                case 'student-sync':
                    endpoint = '/api/v1/mebbis/sync/students';
                    body = { userId: 'admin' };
                    break;
                case 'education-entry':
                    endpoint = '/api/v1/mebbis/education';
                    body = { entries: [], stopOnError: false };
                    break;
                case 'invoice':
                    endpoint = '/api/v1/mebbis/invoice';
                    body = { donem: new Date().toISOString().slice(0, 7) };
                    break;
                case 'bep':
                    endpoint = '/api/v1/mebbis/sync/students'; // Placeholder
                    body = {};
                    break;
                default:
                    throw new Error('Unknown service');
            }

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const data = await response.json();

            if (data.success && data.data?.jobId) {
                // Start polling for job status
                setActiveJob({
                    id: data.data.jobId,
                    type: serviceId,
                    status: 'running',
                    progress: 0,
                    message: 'İşlem kuyruğa eklendi...',
                    startedAt: new Date().toISOString(),
                });

                // Poll job status
                const pollStatus = async () => {
                    const statusRes = await fetch(`/api/v1/mebbis/jobs/${data.data.jobId}`);
                    const statusData = await statusRes.json();

                    if (statusData.success && statusData.data) {
                        const job = statusData.data;
                        setActiveJob((prev) =>
                            prev ? {
                                ...prev,
                                status: job.status,
                                progress: job.progress || 0,
                                message: job.status === 'completed' ? 'Tamamlandı' :
                                    job.status === 'failed' ? 'Hata oluştu' : 'İşleniyor...',
                            } : null
                        );

                        if (job.status === 'completed' || job.status === 'failed') {
                            setServices((prev) =>
                                prev.map((s) =>
                                    s.id === serviceId
                                        ? {
                                            ...s,
                                            status: job.status === 'completed' ? 'success' : 'error' as JobStatus,
                                            lastRun: new Date().toLocaleString('tr-TR'),
                                            lastResult: job.result?.message || (job.error ? `Hata: ${job.error}` : 'İşlem tamamlandı'),
                                        }
                                        : s
                                )
                            );
                            setTimeout(() => {
                                setActiveJob(null);
                                setServices((prev) =>
                                    prev.map((s) => (s.id === serviceId ? { ...s, status: 'idle' as JobStatus } : s))
                                );
                            }, 2000);
                            return;
                        }

                        // Continue polling
                        setTimeout(pollStatus, 2000);
                    }
                };

                pollStatus();
            } else {
                throw new Error(data.error || 'İşlem başlatılamadı');
            }
        } catch (error) {
            console.error('Service error:', error);
            setServices((prev) =>
                prev.map((s) =>
                    s.id === serviceId
                        ? { ...s, status: 'error' as JobStatus, lastResult: 'Bağlantı hatası' }
                        : s
                )
            );
            setActiveJob(null);
        }
    };

    const handleConfigSave = () => {
        if (credentials.tcNo && credentials.password) {
            setIsConfigured(true);
            // In production: save to secure storage
        }
    };

    const getStatusColor = (status: JobStatus) => {
        switch (status) {
            case 'running':
                return 'text-blue-500';
            case 'success':
                return 'text-green-500';
            case 'error':
                return 'text-red-500';
            default:
                return 'text-gray-500';
        }
    };

    const getStatusBg = (status: JobStatus) => {
        switch (status) {
            case 'running':
                return 'bg-blue-100 dark:bg-blue-900/30';
            case 'success':
                return 'bg-green-100 dark:bg-green-900/30';
            case 'error':
                return 'bg-red-100 dark:bg-red-900/30';
            default:
                return 'bg-gray-100 dark:bg-gray-800';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex items-center gap-4">
                        <div className="text-4xl">🏛️</div>
                        <div>
                            <h1 className="text-2xl font-bold">MEBBIS Entegrasyonu</h1>
                            <p className="text-blue-100 mt-1">
                                Milli Eğitim Bakanlığı Bilişim Sistemleri Otomasyon Paneli
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Credentials Config */}
                {!isConfigured && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6 mb-8">
                        <h2 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-4">
                            ⚠️ MEBBIS Kimlik Bilgileri Gerekli
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    TC Kimlik No
                                </label>
                                <input
                                    type="text"
                                    value={credentials.tcNo}
                                    onChange={(e) => setCredentials((c) => ({ ...c, tcNo: e.target.value }))}
                                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                                    placeholder="11111111111"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Şifre
                                </label>
                                <input
                                    type="password"
                                    value={credentials.password}
                                    onChange={(e) => setCredentials((c) => ({ ...c, password: e.target.value }))}
                                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>
                        <button
                            onClick={handleConfigSave}
                            className="mt-4 px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                        >
                            Kaydet ve Devam Et
                        </button>
                    </div>
                )}

                {/* Active Job Progress */}
                {activeJob && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-blue-800 dark:text-blue-200">
                                ⏳ İşlem Devam Ediyor
                            </h3>
                            <span className="text-sm text-blue-600 dark:text-blue-400">{activeJob.message}</span>
                        </div>
                        <div className="h-3 bg-blue-200 dark:bg-blue-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-600 transition-all duration-500"
                                style={{ width: `${activeJob.progress}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Services Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {services.map((service) => (
                        <div
                            key={service.id}
                            className={`rounded-xl p-6 transition-all ${getStatusBg(service.status)}`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl">{service.icon}</span>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white">{service.name}</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                            {service.description}
                                        </p>
                                    </div>
                                </div>
                                <span className={`text-2xl ${getStatusColor(service.status)}`}>
                                    {service.status === 'running' ? '⏳' : service.status === 'success' ? '✅' : '⚪'}
                                </span>
                            </div>

                            {service.lastRun && (
                                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                        Son çalıştırma: {service.lastRun}
                                    </div>
                                    <div className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                                        {service.lastResult}
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={() => runService(service.id)}
                                disabled={service.status === 'running' || !isConfigured}
                                className={`mt-4 w-full py-2 px-4 rounded-lg font-medium transition-colors ${service.status === 'running' || !isConfigured
                                    ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                                    }`}
                            >
                                {service.status === 'running' ? 'Çalışıyor...' : 'Çalıştır'}
                            </button>
                        </div>
                    ))}
                </div>

                {/* Quick Actions */}
                <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        ⚡ Hızlı İşlemler
                    </h2>
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={() => services.forEach((s) => runService(s.id))}
                            disabled={!isConfigured}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                        >
                            🔄 Tümünü Senkronize Et
                        </button>
                        <button className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600">
                            📊 Raporları Görüntüle
                        </button>
                        <button className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600">
                            📋 İş Geçmişi
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}
