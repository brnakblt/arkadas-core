'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type Locale = 'tr' | 'en';

interface Translations {
    [key: string]: string | Translations;
}

interface I18nContextType {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function useI18n() {
    const context = useContext(I18nContext);
    if (!context) {
        throw new Error('useI18n must be used within I18nProvider');
    }
    return context;
}

// Translation files
const translations: Record<Locale, Translations> = {
    tr: {
        common: {
            save: 'Kaydet',
            cancel: 'İptal',
            delete: 'Sil',
            edit: 'Düzenle',
            add: 'Ekle',
            search: 'Ara',
            loading: 'Yükleniyor...',
            error: 'Hata',
            success: 'Başarılı',
            confirm: 'Onayla',
            back: 'Geri',
            next: 'İleri',
            previous: 'Önceki',
            close: 'Kapat',
            yes: 'Evet',
            no: 'Hayır',
            all: 'Tümü',
            none: 'Hiçbiri',
            select: 'Seç',
            noData: 'Veri bulunamadı',
        },
        auth: {
            login: 'Giriş Yap',
            logout: 'Çıkış Yap',
            email: 'E-posta',
            password: 'Şifre',
            forgotPassword: 'Şifremi Unuttum',
            register: 'Kayıt Ol',
            rememberMe: 'Beni Hatırla',
        },
        navigation: {
            home: 'Ana Sayfa',
            dashboard: 'Gösterge Paneli',
            attendance: 'Yoklama',
            schedule: 'Program',
            serviceTracking: 'Servis Takip',
            users: 'Kullanıcılar',
            settings: 'Ayarlar',
            reports: 'Raporlar',
            files: 'Dosyalar',
        },
        attendance: {
            checkIn: 'Giriş',
            checkOut: 'Çıkış',
            present: 'Var',
            absent: 'Yok',
            late: 'Geç',
            excused: 'İzinli',
            date: 'Tarih',
            time: 'Saat',
            student: 'Öğrenci',
            status: 'Durum',
            dailyReport: 'Günlük Rapor',
            monthlyReport: 'Aylık Rapor',
        },
        schedule: {
            week: 'Hafta',
            month: 'Ay',
            day: 'Gün',
            today: 'Bugün',
            class: 'Ders',
            therapy: 'Terapi',
            meeting: 'Toplantı',
            event: 'Etkinlik',
            addEvent: 'Etkinlik Ekle',
        },
        service: {
            route: 'Güzergah',
            driver: 'Şoför',
            vehicle: 'Araç',
            stop: 'Durak',
            arrival: 'Varış',
            departure: 'Kalkış',
            tracking: 'Takip',
            liveLocation: 'Canlı Konum',
        },
        errors: {
            required: 'Bu alan zorunludur',
            invalidEmail: 'Geçersiz e-posta adresi',
            invalidPhone: 'Geçersiz telefon numarası',
            minLength: 'En az {min} karakter olmalıdır',
            maxLength: 'En fazla {max} karakter olabilir',
            passwordMismatch: 'Şifreler eşleşmiyor',
            networkError: 'Bağlantı hatası',
            serverError: 'Sunucu hatası',
        },
        messages: {
            savedSuccessfully: 'Başarıyla kaydedildi',
            deletedSuccessfully: 'Başarıyla silindi',
            confirmDelete: 'Bu öğeyi silmek istediğinizden emin misiniz?',
            unsavedChanges: 'Kaydedilmemiş değişiklikler var',
        },
    },
    en: {
        common: {
            save: 'Save',
            cancel: 'Cancel',
            delete: 'Delete',
            edit: 'Edit',
            add: 'Add',
            search: 'Search',
            loading: 'Loading...',
            error: 'Error',
            success: 'Success',
            confirm: 'Confirm',
            back: 'Back',
            next: 'Next',
            previous: 'Previous',
            close: 'Close',
            yes: 'Yes',
            no: 'No',
            all: 'All',
            none: 'None',
            select: 'Select',
            noData: 'No data found',
        },
        auth: {
            login: 'Login',
            logout: 'Logout',
            email: 'Email',
            password: 'Password',
            forgotPassword: 'Forgot Password',
            register: 'Register',
            rememberMe: 'Remember Me',
        },
        navigation: {
            home: 'Home',
            dashboard: 'Dashboard',
            attendance: 'Attendance',
            schedule: 'Schedule',
            serviceTracking: 'Service Tracking',
            users: 'Users',
            settings: 'Settings',
            reports: 'Reports',
            files: 'Files',
        },
        attendance: {
            checkIn: 'Check In',
            checkOut: 'Check Out',
            present: 'Present',
            absent: 'Absent',
            late: 'Late',
            excused: 'Excused',
            date: 'Date',
            time: 'Time',
            student: 'Student',
            status: 'Status',
            dailyReport: 'Daily Report',
            monthlyReport: 'Monthly Report',
        },
        schedule: {
            week: 'Week',
            month: 'Month',
            day: 'Day',
            today: 'Today',
            class: 'Class',
            therapy: 'Therapy',
            meeting: 'Meeting',
            event: 'Event',
            addEvent: 'Add Event',
        },
        service: {
            route: 'Route',
            driver: 'Driver',
            vehicle: 'Vehicle',
            stop: 'Stop',
            arrival: 'Arrival',
            departure: 'Departure',
            tracking: 'Tracking',
            liveLocation: 'Live Location',
        },
        errors: {
            required: 'This field is required',
            invalidEmail: 'Invalid email address',
            invalidPhone: 'Invalid phone number',
            minLength: 'Must be at least {min} characters',
            maxLength: 'Must be at most {max} characters',
            passwordMismatch: 'Passwords do not match',
            networkError: 'Network error',
            serverError: 'Server error',
        },
        messages: {
            savedSuccessfully: 'Saved successfully',
            deletedSuccessfully: 'Deleted successfully',
            confirmDelete: 'Are you sure you want to delete this item?',
            unsavedChanges: 'You have unsaved changes',
        },
    },
};

/**
 * Get nested translation value
 */
function getNestedValue(obj: Translations, path: string): string | undefined {
    const keys = path.split('.');
    let current: Translations | string = obj;

    for (const key of keys) {
        if (typeof current === 'string') return undefined;
        current = current[key];
        if (current === undefined) return undefined;
    }

    return typeof current === 'string' ? current : undefined;
}

/**
 * Replace parameters in translation string
 */
function interpolate(str: string, params?: Record<string, string | number>): string {
    if (!params) return str;

    return str.replace(/\{(\w+)\}/g, (_, key) => {
        return params[key]?.toString() ?? `{${key}}`;
    });
}

export function I18nProvider({ children }: { children: ReactNode }) {
    const [locale, setLocaleState] = useState<Locale>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('locale') as Locale;
            if (saved && translations[saved]) return saved;
        }
        return 'tr';
    });

    const setLocale = useCallback((newLocale: Locale) => {
        setLocaleState(newLocale);
        if (typeof window !== 'undefined') {
            localStorage.setItem('locale', newLocale);
            document.documentElement.lang = newLocale;
        }
    }, []);

    const t = useCallback(
        (key: string, params?: Record<string, string | number>): string => {
            const value = getNestedValue(translations[locale], key);
            if (!value) {
                console.warn(`Translation missing: ${key}`);
                return key;
            }
            return interpolate(value, params);
        },
        [locale]
    );

    return (
        <I18nContext.Provider value={{ locale, setLocale, t }}>
            {children}
        </I18nContext.Provider>
    );
}

/**
 * Language Selector Component
 */
export function LanguageSelector({ className = '' }: { className?: string }) {
    const { locale, setLocale } = useI18n();

    const languages: { code: Locale; name: string; flag: string }[] = [
        { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
        { code: 'en', name: 'English', flag: '🇬🇧' },
    ];

    return (
        <select
            value={locale}
            onChange={(e) => setLocale(e.target.value as Locale)}
            className={`px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm ${className}`}
            aria-label="Dil seçimi"
        >
            {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name}
                </option>
            ))}
        </select>
    );
}
