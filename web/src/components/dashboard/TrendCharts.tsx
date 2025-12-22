'use client';

/**
 * Trend Charts Widget
 * 
 * Dashboard widget showing weekly/monthly attendance and performance trends.
 */

import React, { useState, useMemo } from 'react';

// ============================================================
// Types
// ============================================================

type TimeRange = 'week' | 'month' | 'quarter';

interface TrendData {
    label: string;
    attendance: number;
    onTime: number;
    late: number;
    absent: number;
}

interface TrendChartsProps {
    className?: string;
    data?: TrendData[];
}

// ============================================================
// Mock Data
// ============================================================

const weeklyData: TrendData[] = [
    { label: 'Pzt', attendance: 92, onTime: 85, late: 7, absent: 8 },
    { label: 'Sal', attendance: 95, onTime: 88, late: 7, absent: 5 },
    { label: 'Çar', attendance: 88, onTime: 80, late: 8, absent: 12 },
    { label: 'Per', attendance: 94, onTime: 87, late: 7, absent: 6 },
    { label: 'Cum', attendance: 90, onTime: 82, late: 8, absent: 10 },
];

const monthlyData: TrendData[] = [
    { label: '1. Hafta', attendance: 91, onTime: 84, late: 7, absent: 9 },
    { label: '2. Hafta', attendance: 93, onTime: 86, late: 7, absent: 7 },
    { label: '3. Hafta', attendance: 89, onTime: 81, late: 8, absent: 11 },
    { label: '4. Hafta', attendance: 94, onTime: 88, late: 6, absent: 6 },
];

const quarterlyData: TrendData[] = [
    { label: 'Ekim', attendance: 91, onTime: 84, late: 7, absent: 9 },
    { label: 'Kasım', attendance: 93, onTime: 85, late: 8, absent: 7 },
    { label: 'Aralık', attendance: 90, onTime: 82, late: 8, absent: 10 },
];

// ============================================================
// Component
// ============================================================

export function TrendCharts({ className = '', data }: TrendChartsProps) {
    const [timeRange, setTimeRange] = useState<TimeRange>('week');
    const [chartType, setChartType] = useState<'bar' | 'line'>('bar');

    const chartData = useMemo(() => {
        if (data) return data;
        switch (timeRange) {
            case 'week':
                return weeklyData;
            case 'month':
                return monthlyData;
            case 'quarter':
                return quarterlyData;
            default:
                return weeklyData;
        }
    }, [timeRange, data]);

    const averageAttendance = useMemo(() => {
        const sum = chartData.reduce((acc, d) => acc + d.attendance, 0);
        return Math.round(sum / chartData.length);
    }, [chartData]);

    const maxValue = 100; // Percentage

    return (
        <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden ${className}`}>
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                    <h3 className="text-white font-semibold text-lg">📈 Trend Analizi</h3>
                    <div className="flex items-center gap-2">
                        {/* Time Range Selector */}
                        <div className="flex bg-purple-500/30 rounded-lg p-0.5">
                            {(['week', 'month', 'quarter'] as TimeRange[]).map((range) => (
                                <button
                                    key={range}
                                    className={`px-3 py-1 text-sm rounded-md transition-colors ${timeRange === range
                                            ? 'bg-white text-purple-700'
                                            : 'text-white hover:bg-white/10'
                                        }`}
                                    onClick={() => setTimeRange(range)}
                                >
                                    {range === 'week' ? 'Hafta' : range === 'month' ? 'Ay' : 'Çeyrek'}
                                </button>
                            ))}
                        </div>
                        {/* Chart Type Toggle */}
                        <div className="flex bg-purple-500/30 rounded-lg p-0.5">
                            <button
                                className={`px-2 py-1 text-sm rounded-md transition-colors ${chartType === 'bar' ? 'bg-white text-purple-700' : 'text-white hover:bg-white/10'
                                    }`}
                                onClick={() => setChartType('bar')}
                                aria-label="Çubuk grafik"
                            >
                                📊
                            </button>
                            <button
                                className={`px-2 py-1 text-sm rounded-md transition-colors ${chartType === 'line' ? 'bg-white text-purple-700' : 'text-white hover:bg-white/10'
                                    }`}
                                onClick={() => setChartType('line')}
                                aria-label="Çizgi grafik"
                            >
                                📉
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-6">
                {/* Summary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <SummaryCard
                        label="Ortalama Katılım"
                        value={`%${averageAttendance}`}
                        trend={averageAttendance >= 90 ? 'up' : averageAttendance >= 80 ? 'stable' : 'down'}
                        color="blue"
                    />
                    <SummaryCard
                        label="Zamanında Gelen"
                        value={`%${Math.round(chartData.reduce((a, d) => a + d.onTime, 0) / chartData.length)}`}
                        trend="up"
                        color="green"
                    />
                    <SummaryCard
                        label="Geç Kalan"
                        value={`%${Math.round(chartData.reduce((a, d) => a + d.late, 0) / chartData.length)}`}
                        trend="stable"
                        color="yellow"
                    />
                    <SummaryCard
                        label="Devamsız"
                        value={`%${Math.round(chartData.reduce((a, d) => a + d.absent, 0) / chartData.length)}`}
                        trend="down"
                        color="red"
                    />
                </div>

                {/* Chart */}
                <div className="relative">
                    {chartType === 'bar' ? (
                        <BarChart data={chartData} maxValue={maxValue} />
                    ) : (
                        <LineChart data={chartData} maxValue={maxValue} />
                    )}
                </div>

                {/* Legend */}
                <div className="flex flex-wrap justify-center gap-4 mt-6">
                    <LegendItem color="bg-green-500" label="Zamanında" />
                    <LegendItem color="bg-yellow-500" label="Geç" />
                    <LegendItem color="bg-red-500" label="Devamsız" />
                </div>
            </div>
        </div>
    );
}

// ============================================================
// Sub-components
// ============================================================

interface SummaryCardProps {
    label: string;
    value: string;
    trend: 'up' | 'down' | 'stable';
    color: 'blue' | 'green' | 'yellow' | 'red';
}

function SummaryCard({ label, value, trend, color }: SummaryCardProps) {
    const colorClasses = {
        blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400',
        green: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400',
        yellow: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400',
        red: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400',
    };

    const trendIcons = {
        up: '↑',
        down: '↓',
        stable: '→',
    };

    return (
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{value}</span>
                <span className="text-lg">{trendIcons[trend]}</span>
            </div>
            <p className="text-sm opacity-80 mt-1">{label}</p>
        </div>
    );
}

interface ChartProps {
    data: TrendData[];
    maxValue: number;
}

function BarChart({ data, maxValue }: ChartProps) {
    return (
        <div className="flex items-end justify-between gap-2 h-48">
            {data.map((item, index) => {
                const onTimeHeight = (item.onTime / maxValue) * 100;
                const lateHeight = (item.late / maxValue) * 100;
                const absentHeight = (item.absent / maxValue) * 100;

                return (
                    <div key={index} className="flex-1 flex flex-col items-center gap-1">
                        {/* Stacked Bar */}
                        <div className="w-full flex flex-col-reverse h-40 rounded-t-lg overflow-hidden">
                            <div
                                className="w-full bg-green-500 transition-all duration-500"
                                style={{ height: `${onTimeHeight}%` }}
                                title={`Zamanında: %${item.onTime}`}
                            />
                            <div
                                className="w-full bg-yellow-500 transition-all duration-500"
                                style={{ height: `${lateHeight}%` }}
                                title={`Geç: %${item.late}`}
                            />
                            <div
                                className="w-full bg-red-500 transition-all duration-500"
                                style={{ height: `${absentHeight}%` }}
                                title={`Devamsız: %${item.absent}`}
                            />
                        </div>
                        {/* Label */}
                        <span className="text-xs text-gray-500 dark:text-gray-400 mt-2">{item.label}</span>
                    </div>
                );
            })}
        </div>
    );
}

function LineChart({ data, maxValue }: ChartProps) {
    const width = 100;
    const height = 48; // viewBox height
    const padding = 2;

    const points = data.map((item, index) => {
        const x = padding + (index / (data.length - 1)) * (width - 2 * padding);
        const y = height - padding - (item.attendance / maxValue) * (height - 2 * padding);
        return { x, y, item };
    });

    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

    return (
        <div className="relative h-48">
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 bottom-8 w-8 flex flex-col justify-between text-xs text-gray-400">
                <span>100%</span>
                <span>50%</span>
                <span>0%</span>
            </div>

            {/* Chart */}
            <div className="ml-10 h-40">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
                    {/* Grid lines */}
                    <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#e5e7eb" strokeWidth="0.5" strokeDasharray="2" />

                    {/* Line */}
                    <path d={linePath} fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

                    {/* Area fill */}
                    <path
                        d={`${linePath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`}
                        fill="url(#gradient)"
                        opacity="0.3"
                    />

                    {/* Gradient definition */}
                    <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#8b5cf6" />
                            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    {/* Data points */}
                    {points.map((p, i) => (
                        <circle key={i} cx={p.x} cy={p.y} r="1.5" fill="#8b5cf6" />
                    ))}
                </svg>
            </div>

            {/* X-axis labels */}
            <div className="flex justify-between ml-10 mt-2">
                {data.map((item, index) => (
                    <span key={index} className="text-xs text-gray-500 dark:text-gray-400">
                        {item.label}
                    </span>
                ))}
            </div>
        </div>
    );
}

function LegendItem({ color, label }: { color: string; label: string }) {
    return (
        <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${color}`} />
            <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
        </div>
    );
}

export default TrendCharts;
