'use client';

interface AttendanceStatsData {
    totalStudents: number;
    presentToday: number;
    absentToday: number;
    lateToday: number;
    attendanceRate: number;
    weeklyTrend: number[];
}

interface AttendanceStatsProps {
    stats: AttendanceStatsData;
}

export default function AttendanceStats({ stats }: AttendanceStatsProps) {
    const cards = [
        {
            title: 'Toplam Öğrenci',
            value: stats.totalStudents,
            icon: '👥',
            color: 'bg-blue-500',
            bgColor: 'bg-blue-50',
        },
        {
            title: 'Bugün Geldi',
            value: stats.presentToday,
            icon: '✅',
            color: 'bg-green-500',
            bgColor: 'bg-green-50',
        },
        {
            title: 'Gelmedi',
            value: stats.absentToday,
            icon: '❌',
            color: 'bg-red-500',
            bgColor: 'bg-red-50',
        },
        {
            title: 'Geç Kaldı',
            value: stats.lateToday,
            icon: '⏰',
            color: 'bg-yellow-500',
            bgColor: 'bg-yellow-50',
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {cards.map((card, index) => (
                <div
                    key={index}
                    className={`stats-card ${card.bgColor} rounded-xl p-5 border border-gray-100`}
                >
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-600 text-sm font-medium">{card.title}</p>
                            <p className="text-3xl font-bold text-gray-900 mt-1">{card.value}</p>
                        </div>
                        <span className="text-2xl">{card.icon}</span>
                    </div>
                </div>
            ))}

            {/* Attendance Rate Card */}
            <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <p className="text-gray-600 text-sm font-medium">Devam Oranı</p>
                        <p className="text-3xl font-bold text-gray-900">%{stats.attendanceRate.toFixed(1)}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${stats.attendanceRate >= 90
                        ? 'bg-green-100 text-green-700'
                        : stats.attendanceRate >= 75
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                        {stats.attendanceRate >= 90 ? 'Mükemmel' : stats.attendanceRate >= 75 ? 'İyi' : 'Düşük'}
                    </div>
                </div>

                {/* Weekly Trend Chart (simple bar visualization) */}
                <div className="flex items-end gap-1 h-16">
                    {stats.weeklyTrend.map((value, index) => (
                        <div key={index} className="flex-1 flex flex-col items-center">
                            <div
                                className="w-full bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                                style={{ height: `${(value / 100) * 64}px` }}
                            />
                            <span className="text-xs text-gray-500 mt-1">
                                {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'][index]}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="lg:col-span-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl p-5 text-white">
                <h3 className="font-semibold text-lg mb-3">Hızlı İşlemler</h3>
                <div className="grid grid-cols-2 gap-3">
                    <button className="bg-white/20 hover:bg-white/30 rounded-lg p-3 text-left transition-colors">
                        <span className="text-xl">📷</span>
                        <p className="font-medium mt-1">Yüz Tanıma ile Yoklama</p>
                    </button>
                    <button className="bg-white/20 hover:bg-white/30 rounded-lg p-3 text-left transition-colors">
                        <span className="text-xl">✏️</span>
                        <p className="font-medium mt-1">Manuel Yoklama Girişi</p>
                    </button>
                    <button className="bg-white/20 hover:bg-white/30 rounded-lg p-3 text-left transition-colors">
                        <span className="text-xl">📊</span>
                        <p className="font-medium mt-1">Aylık Rapor</p>
                    </button>
                    <button className="bg-white/20 hover:bg-white/30 rounded-lg p-3 text-left transition-colors">
                        <span className="text-xl">📧</span>
                        <p className="font-medium mt-1">Veli Bildirimi</p>
                    </button>
                </div>
            </div>
        </div>
    );
}
