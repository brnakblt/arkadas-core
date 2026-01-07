'use client';

interface UserFiltersProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    roleFilter: string;
    onRoleChange: (role: string) => void;
    statusFilter: string;
    onStatusChange: (status: string) => void;
}

const ROLES = [
    { value: 'all', label: 'Tüm Roller' },
    { value: 'super_admin', label: '👑 Süper Yönetici' },
    { value: 'admin', label: '🔧 Yönetici' },
    { value: 'teacher', label: '👩‍🏫 Öğretmen' },
    { value: 'therapist', label: '🧠 Terapist' },
    { value: 'driver', label: '🚌 Şoför' },
    { value: 'parent', label: '👨‍👩‍👧 Veli' },
    { value: 'student', label: '🎒 Öğrenci' },
];

const STATUSES = [
    { value: 'all', label: 'Tüm Durumlar' },
    { value: 'active', label: '✅ Aktif' },
    { value: 'inactive', label: '⏸️ Pasif' },
    { value: 'pending', label: '⏳ Beklemede' },
];

export default function UserFilters({
    searchQuery,
    onSearchChange,
    roleFilter,
    onRoleChange,
    statusFilter,
    onStatusChange,
}: UserFiltersProps) {
    return (
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Search */}
                <div className="md:col-span-2">
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                        <input
                            type="text"
                            placeholder="İsim, e-posta veya kullanıcı adı ara..."
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Role Filter */}
                <div>
                    <select
                        value={roleFilter}
                        onChange={(e) => onRoleChange(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    >
                        {ROLES.map(role => (
                            <option key={role.value} value={role.value}>
                                {role.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Status Filter */}
                <div>
                    <select
                        value={statusFilter}
                        onChange={(e) => onStatusChange(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    >
                        {STATUSES.map(status => (
                            <option key={status.value} value={status.value}>
                                {status.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );
}
