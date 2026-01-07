'use client';

/**
 * Dashboard Chart Components
 * Simple SVG-based charts (no external dependencies)
 */

interface ChartData {
    label: string;
    value: number;
    color?: string;
}

const COLORS = [
    '#3B82F6', // blue
    '#10B981', // green
    '#F59E0B', // amber
    '#EF4444', // red
    '#8B5CF6', // purple
    '#EC4899', // pink
    '#06B6D4', // cyan
    '#F97316', // orange
];

// ============================================================
// Bar Chart
// ============================================================

interface BarChartProps {
    data: ChartData[];
    height?: number;
    showValues?: boolean;
    className?: string;
}

export function BarChart({
    data,
    height = 200,
    showValues = true,
    className = '',
}: BarChartProps) {
    const maxValue = Math.max(...data.map((d) => d.value));
    const barWidth = 100 / data.length;

    return (
        <div className={className}>
            <svg viewBox={`0 0 100 ${height}`} className="w-full" preserveAspectRatio="none">
                {data.map((item, index) => {
                    const barHeight = (item.value / maxValue) * (height - 30);
                    const x = index * barWidth + barWidth * 0.1;
                    const y = height - barHeight - 20;
                    const color = item.color || COLORS[index % COLORS.length];

                    return (
                        <g key={index}>
                            {/* Bar */}
                            <rect
                                x={x}
                                y={y}
                                width={barWidth * 0.8}
                                height={barHeight}
                                fill={color}
                                rx={2}
                                className="transition-all hover:opacity-80"
                            />
                            {/* Value */}
                            {showValues && (
                                <text
                                    x={x + barWidth * 0.4}
                                    y={y - 5}
                                    textAnchor="middle"
                                    className="text-[8px] fill-gray-600 dark:fill-gray-400"
                                >
                                    {item.value}
                                </text>
                            )}
                            {/* Label */}
                            <text
                                x={x + barWidth * 0.4}
                                y={height - 5}
                                textAnchor="middle"
                                className="text-[6px] fill-gray-500 dark:fill-gray-400"
                            >
                                {item.label.slice(0, 6)}
                            </text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}

// ============================================================
// Pie Chart
// ============================================================

interface PieChartProps {
    data: ChartData[];
    size?: number;
    showLabels?: boolean;
    className?: string;
}

export function PieChart({
    data,
    size = 200,
    showLabels = true,
    className = '',
}: PieChartProps) {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    const center = size / 2;
    const radius = size / 2 - 10;

    let currentAngle = -90;

    const slices = data.map((item, index) => {
        const percentage = (item.value / total) * 100;
        const angle = (percentage / 100) * 360;
        const startAngle = currentAngle;
        const endAngle = currentAngle + angle;
        currentAngle = endAngle;

        const startRad = (startAngle * Math.PI) / 180;
        const endRad = (endAngle * Math.PI) / 180;

        const x1 = center + radius * Math.cos(startRad);
        const y1 = center + radius * Math.sin(startRad);
        const x2 = center + radius * Math.cos(endRad);
        const y2 = center + radius * Math.sin(endRad);

        const largeArc = angle > 180 ? 1 : 0;
        const color = item.color || COLORS[index % COLORS.length];

        const path = `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

        return { path, color, label: item.label, percentage };
    });

    return (
        <div className={`flex flex-col items-center ${className}`}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                {slices.map((slice, index) => (
                    <path
                        key={index}
                        d={slice.path}
                        fill={slice.color}
                        className="transition-all hover:opacity-80 cursor-pointer"
                    />
                ))}
                {/* Center circle for donut effect */}
                <circle
                    cx={center}
                    cy={center}
                    r={radius * 0.5}
                    fill="white"
                    className="dark:fill-gray-800"
                />
            </svg>
            {showLabels && (
                <div className="mt-4 flex flex-wrap justify-center gap-3">
                    {slices.map((slice, index) => (
                        <div key={index} className="flex items-center gap-1.5 text-sm">
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: slice.color }}
                            />
                            <span className="text-gray-600 dark:text-gray-400">
                                {slice.label} ({slice.percentage.toFixed(0)}%)
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ============================================================
// Line Chart
// ============================================================

interface LineChartProps {
    data: ChartData[];
    height?: number;
    showDots?: boolean;
    showGrid?: boolean;
    className?: string;
}

export function LineChart({
    data,
    height = 200,
    showDots = true,
    showGrid = true,
    className = '',
}: LineChartProps) {
    const maxValue = Math.max(...data.map((d) => d.value));
    const minValue = Math.min(...data.map((d) => d.value));
    const range = maxValue - minValue || 1;

    const points = data.map((item, index) => {
        const x = (index / (data.length - 1)) * 100;
        const y = height - 30 - ((item.value - minValue) / range) * (height - 50);
        return { x, y, value: item.value, label: item.label };
    });

    const pathData = points
        .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
        .join(' ');

    return (
        <div className={className}>
            <svg viewBox={`0 0 100 ${height}`} className="w-full" preserveAspectRatio="none">
                {/* Grid */}
                {showGrid && (
                    <g className="stroke-gray-200 dark:stroke-gray-700">
                        {[0, 25, 50, 75, 100].map((y) => (
                            <line
                                key={y}
                                x1={0}
                                y1={(y / 100) * (height - 50) + 10}
                                x2={100}
                                y2={(y / 100) * (height - 50) + 10}
                                strokeWidth={0.5}
                            />
                        ))}
                    </g>
                )}

                {/* Line */}
                <path
                    d={pathData}
                    fill="none"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* Dots */}
                {showDots &&
                    points.map((p, index) => (
                        <g key={index}>
                            <circle cx={p.x} cy={p.y} r={3} fill="#3B82F6" />
                            <text
                                x={p.x}
                                y={height - 5}
                                textAnchor="middle"
                                className="text-[6px] fill-gray-500 dark:fill-gray-400"
                            >
                                {p.label.slice(0, 4)}
                            </text>
                        </g>
                    ))}
            </svg>
        </div>
    );
}

// ============================================================
// Stats Card
// ============================================================

interface StatCardProps {
    title: string;
    value: string | number;
    change?: number;
    icon?: string;
    color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
    className?: string;
}

export function StatCard({
    title,
    value,
    change,
    icon = '📊',
    color = 'blue',
    className = '',
}: StatCardProps) {
    const colorClasses = {
        blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
        green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
        red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
        yellow: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
        purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    };

    return (
        <div className={`bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm ${className}`}>
            <div className="flex items-center justify-between mb-3">
                <span className={`text-2xl p-2 rounded-lg ${colorClasses[color]}`}>{icon}</span>
                {change !== undefined && (
                    <span
                        className={`text-sm font-medium ${change >= 0 ? 'text-green-500' : 'text-red-500'
                            }`}
                    >
                        {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
                    </span>
                )}
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{title}</p>
        </div>
    );
}
