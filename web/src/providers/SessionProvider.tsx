'use client';

import React, { createContext, useContext, ReactNode } from 'react';

interface SessionContextType {
    user: any;
    isAuthenticated: boolean;
}

const SessionContext = createContext<SessionContextType | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
    return (
        <SessionContext.Provider value={{ user: null, isAuthenticated: false }}>
            {children}
        </SessionContext.Provider>
    );
}

export function useSession() {
    const context = useContext(SessionContext);
    return context;
}
