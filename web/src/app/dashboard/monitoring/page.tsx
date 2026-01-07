'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDashboard } from '@/context/DashboardContext';
import Card from '@/components/ui/Card';

interface SystemStats {
    cpu: {
        manufacturer: string;
        brand: string;
        cores: number;
        load: string;
    };
    memory: {
        total: number;
        free: number;
        used: number;
        active: number;
        available: number;
    };
    disk: {
        fs: string;
        type: string;
        size: number;
        used: number;
        use: number;
        mount: string;
    }[];
    timestamp: string;
}

interface HealtCheck {
    database: string;
    redis: string;
    uptime: number;
    timestamp: string;
}

export default function MonitoringPage() {
    const { user, loading: userLoading } = useDashboard();
    const router = useRouter();
    const [stats, setStats] = useState<SystemStats | null>(null);
    const [health, setHealth] = useState<HealtCheck | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!userLoading) {
            if (!user) {
                router.push('/');
                return;
            }
            // Access Control: Allow 'admin', 'barannakblut', or explicit admin roles
            const isAdmin = user.username === 'admin' ||
                user.username === 'barannakblut' ||
                user.role?.type === 'admin' ||
                user.role?.type === 'super-admin';

            if (!isAdmin) {
                router.push('/dashboard');
            }
        }
    }, [user, userLoading, router]);

    const fetchData = async () => {
        try {
            // In production, use your configured API URL helper
            // Creating a simple fetch here. Assuming frontend proxies to backend or using absolute URL for dev (CORS might be issue if not configured, but locally usually fine or handled by next.config rewrites if any)
            // Since web is 3000 and strapi 1337, we likely need NEXT_PUBLIC_API_URL
            const apiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

            const statsRes = await fetch(`${apiUrl}/api/system-monitor/stats`);
            const healthRes = await fetch(`${apiUrl}/api/system-monitor/health`);

            if (!statsRes.ok || !healthRes.ok) {
                throw new Error('Failed to fetch monitoring data');
            }

            const statsData = await statsRes.json();
            const healthData = await healthRes.json();

            setStats(statsData);
            setHealth(healthData);
            setError('');
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Error fetching data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000); // 30s refresh
        return () => clearInterval(interval);
    }, []);

    if (loading && !stats) return <div className="p-8">Loading monitoring data...</div>;
    if (error) return <div className="p-8 text-red-500">Error: {error}</div>;

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getStatusColor = (status: string) => status === 'connected' ? 'bg-green-500' : 'bg-red-500';

    return (
        <div className="p-8 space-y-8">
            <h1 className="text-3xl font-bold text-gray-800">Server Monitoring</h1>

            {/* Health Status */}
            {/* Health Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6 flex items-center justify-between">
                    <div>
                        <h3 className="text-gray-500 text-sm">Database (Postgres)</h3>
                        <p className="text-xl font-semibold capitalize">{health?.database}</p>
                    </div>
                    <div className={`w-4 h-4 rounded-full ${getStatusColor(health?.database || 'unknown')}`}></div>
                </Card>
                <Card className="p-6 flex items-center justify-between">
                    <div>
                        <h3 className="text-gray-500 text-sm">Redis</h3>
                        <p className="text-xl font-semibold capitalize">{health?.redis}</p>
                    </div>
                    <div className={`w-4 h-4 rounded-full ${health?.redis === 'connected' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                </Card>
                <Card className="p-6">
                    <h3 className="text-gray-500 text-sm">Uptime</h3>
                    <p className="text-xl font-semibold">{(health?.uptime || 0 / 3600).toFixed(2)} hours</p>
                </Card>
            </div>

            {/* Resource Usage */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* CPU & RAM */}
                {/* CPU & RAM */}
                <div className="space-y-6">
                    <Card className="p-6">
                        <h2 className="text-xl font-semibold mb-4">CPU</h2>
                        <div className="space-y-4">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Model</span>
                                <span className="font-medium">{stats?.cpu.manufacturer} {stats?.cpu.brand}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Cores</span>
                                <span className="font-medium">{stats?.cpu.cores}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Current Load</span>
                                <div className="flex items-center space-x-2">
                                    <div className="w-32 bg-gray-200 rounded-full h-2.5">
                                        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${Math.min(parseFloat(stats?.cpu.load || '0'), 100)}%` }}></div>
                                    </div>
                                    <span className="font-medium">{stats?.cpu.load}%</span>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <h2 className="text-xl font-semibold mb-4">Memory</h2>
                        <div className="space-y-4">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Total</span>
                                <span className="font-medium">{formatBytes(stats?.memory.total || 0)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Used</span>
                                <span className="font-medium">{formatBytes(stats?.memory.used || 0)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Free</span>
                                <span className="font-medium">{formatBytes(stats?.memory.free || 0)}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                                <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: `${((stats?.memory.used || 0) / (stats?.memory.total || 1)) * 100}%` }}></div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* File Systems */}
                <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Disk Usage</h2>
                    <div className="space-y-6">
                        {stats?.disk.filter(d => d.size > 0).map((d, i) => (
                            <div key={i} className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium">{d.mount}</span>
                                    <span className="text-gray-500">{formatBytes(d.used)} / {formatBytes(d.size)} ({d.use}%)</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div className={`h-2 rounded-full ${d.use > 90 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${d.use}%` }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
}
