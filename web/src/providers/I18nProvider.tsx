'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface I18nContextType {
    locale: string;
    setLocale: (locale: string) => void;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
    const [locale, setLocale] = useState('tr');

    return (
        <I18nContext.Provider value={{ locale, setLocale }}>
            {children}
        </I18nContext.Provider>
    );
}

export function useI18n() {
    const context = useContext(I18nContext);
    return context;
}
