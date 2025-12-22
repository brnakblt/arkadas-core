'use client';

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
    avatar?: string;
}

interface UserTableProps {
    users: User[];
    onView: (user: User) => void;
    onEdit: (user: User) => void;
    onDelete: (userId: string) => void;
    onToggleStatus: (userId: string) => void;
}

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
    super_admin: { label: 'Süper Yönetici', color: 'bg-red-100 text-red-700' },
    admin: { label: 'Yönetici', color: 'bg-orange-100 text-orange-700' },
    teacher: { label: 'Öğretmen', color: 'bg-blue-100 text-blue-700' },
    therapist: { label: 'Terapist', color: 'bg-purple-100 text-purple-700' },
    driver: { label: 'Şoför', color: 'bg-yellow-100 text-yellow-700' },
    parent: { label: 'Veli', color: 'bg-green-100 text-green-700' },
    student: { label: 'Öğrenci', color: 'bg-cyan-100 text-cyan-700' },
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    active: { label: 'Aktif', color: 'bg-green-100 text-green-700' },
    inactive: { label: 'Pasif', color: 'bg-gray-100 text-gray-600' },
    pending: { label: 'Beklemede', color: 'bg-yellow-100 text-yellow-700' },
};

export default function UserTable({ users, onView, onEdit, onDelete, onToggleStatus }: UserTableProps) {
    if (users.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <span className="text-4xl">👤</span>
                <p className="text-gray-500 mt-2">Kullanıcı bulunamadı</p>
            </div>
        );
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('tr-TR');
    };

    const formatLastLogin = (dateStr?: string) => {
        if (!dateStr) return 'Hiç giriş yapmadı';
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

        if (diffHours < 1) return 'Az önce';
        if (diffHours < 24) return `${diffHours} saat önce`;
        const diffDays = Math.floor(diffHours / 24);
        if (diffDays < 7) return `${diffDays} gün önce`;
        return formatDate(dateStr);
    };

    return (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="text-left py-4 px-5 font-semibold text-gray-700">Kullanıcı</th>
                            <th className="text-left py-4 px-5 font-semibold text-gray-700">Rol</th>
                            <th className="text-left py-4 px-5 font-semibold text-gray-700">Durum</th>
                            <th className="text-left py-4 px-5 font-semibold text-gray-700">Son Giriş</th>
                            <th className="text-left py-4 px-5 font-semibold text-gray-700">Kayıt Tarihi</th>
                            <th className="text-left py-4 px-5 font-semibold text-gray-700">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                {/* User Info */}
                                <td className="py-4 px-5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-medium">
                                            {user.fullName.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{user.fullName}</p>
                                            <p className="text-sm text-gray-500">{user.email}</p>
                                        </div>
                                    </div>
                                </td>

                                {/* Role */}
                                <td className="py-4 px-5">
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${ROLE_LABELS[user.role].color}`}>
                                        {ROLE_LABELS[user.role].label}
                                    </span>
                                </td>

                                {/* Status */}
                                <td className="py-4 px-5">
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_LABELS[user.status].color}`}>
                                        {STATUS_LABELS[user.status].label}
                                    </span>
                                </td>

                                {/* Last Login */}
                                <td className="py-4 px-5 text-gray-500 text-sm">
                                    {formatLastLogin(user.lastLogin)}
                                </td>

                                {/* Created Date */}
                                <td className="py-4 px-5 text-gray-500 text-sm">
                                    {formatDate(user.createdAt)}
                                </td>

                                {/* Actions */}
                                <td className="py-4 px-5">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => onView(user)}
                                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Görüntüle"
                                        >
                                            👁️
                                        </button>
                                        <button
                                            onClick={() => onEdit(user)}
                                            className="p-2 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                                            title="Düzenle"
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            onClick={() => onToggleStatus(user.id)}
                                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                            title={user.status === 'active' ? 'Devre Dışı Bırak' : 'Aktifleştir'}
                                        >
                                            {user.status === 'active' ? '⏸️' : '▶️'}
                                        </button>
                                        <button
                                            onClick={() => onDelete(user.id)}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Sil"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
