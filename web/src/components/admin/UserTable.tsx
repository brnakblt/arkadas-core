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
    super_admin: { label: 'Süper Yönetici', color: 'bg-primary-dark text-white' },
    admin: { label: 'Yönetici', color: 'bg-primary text-white' },
    teacher: { label: 'Öğretmen', color: 'bg-secondary text-white' },
    therapist: { label: 'Terapist', color: 'bg-primary/10 text-primary-dark' },
    driver: { label: 'Şoför', color: 'bg-secondary/10 text-secondary-dark' },
    parent: { label: 'Veli', color: 'bg-primary/5 text-primary-dark' },
    student: { label: 'Öğrenci', color: 'bg-slate-100 text-slate-700' },
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    active: { label: 'Aktif', color: 'bg-green-100 text-green-700' },
    inactive: { label: 'Pasif', color: 'bg-gray-100 text-gray-600' },
    pending: { label: 'Beklemede', color: 'bg-orange-100 text-orange-700' },
};

export default function UserTable({ users, onView, onEdit, onDelete, onToggleStatus }: UserTableProps) {
    if (users.length === 0) {
        return (
            <div className="bg-white rounded-2xl shadow-sm p-12 text-center border border-slate-100">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl opacity-50">👤</span>
                </div>
                <p className="text-slate-500 font-medium">Kullanıcı bulunamadı</p>
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
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-100">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-slate-50/50 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-b border-slate-100">
                            <th className="text-left py-4 px-6">Kullanıcı</th>
                            <th className="text-left py-4 px-6">Rol</th>
                            <th className="text-left py-4 px-6">Durum</th>
                            <th className="text-left py-4 px-6">Son Giriş</th>
                            <th className="text-left py-4 px-6">Kayıt Tarihi</th>
                            <th className="text-right py-4 px-6">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-primary/5 transition-colors group">
                                {/* User Info */}
                                <td className="py-4 px-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white font-bold shadow-sm ring-2 ring-white">
                                            {user.fullName.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 group-hover:text-primary transition-colors">{user.fullName}</p>
                                            <p className="text-[11px] text-slate-400 font-medium">{user.email}</p>
                                        </div>
                                    </div>
                                </td>

                                {/* Role */}
                                <td className="py-4 px-6">
                                    <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${ROLE_LABELS[user.role].color} border border-black/5 shadow-sm inline-block`}>
                                        {ROLE_LABELS[user.role].label}
                                    </span>
                                </td>

                                {/* Status */}
                                <td className="py-4 px-6">
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${STATUS_LABELS[user.status].color} flex items-center gap-1.5 w-fit`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'active' ? 'bg-green-600' : (user.status === 'pending' ? 'bg-orange-500' : 'bg-slate-400')}`} />
                                        {STATUS_LABELS[user.status].label}
                                    </span>
                                </td>

                                {/* Last Login */}
                                <td className="py-4 px-6 text-slate-500 font-medium text-xs">
                                    {formatLastLogin(user.lastLogin)}
                                </td>

                                {/* Created Date */}
                                <td className="py-4 px-6 text-slate-400 text-xs font-medium">
                                    {formatDate(user.createdAt)}
                                </td>

                                {/* Actions */}
                                <td className="py-4 px-6 text-right">
                                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => onView(user)}
                                            className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                                            title="Görüntüle"
                                            aria-label={`${user.fullName} detaylarını görüntüle`}
                                        >
                                            👁️
                                        </button>
                                        <button
                                            onClick={() => onEdit(user)}
                                            className="p-2 text-slate-400 hover:text-secondary hover:bg-secondary/10 rounded-xl transition-all"
                                            title="Düzenle"
                                            aria-label={`${user.fullName} bilgilerini düzenle`}
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            onClick={() => onToggleStatus(user.id)}
                                            className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                                            title={user.status === 'active' ? 'Devre Dışı Bırak' : 'Aktifleştir'}
                                            aria-label={user.status === 'active' ? `${user.fullName} kullanıcısını devre dışı bırak` : `${user.fullName} kullanıcısını aktifleştir`}
                                        >
                                            {user.status === 'active' ? '⏸️' : '▶️'}
                                        </button>
                                        <button
                                            onClick={() => onDelete(user.id)}
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                            title="Sil"
                                            aria-label={`${user.fullName} kullanıcısını sil`}
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
