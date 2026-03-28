'use client';

import React, { createContext, useContext, ReactNode } from 'react';

interface KeyboardContextType {
    isKeyboardActive: boolean;
}

const KeyboardContext = createContext<KeyboardContextType | null>(null);

export function KeyboardProvider({ children }: { children: ReactNode }) {
    return (
        <KeyboardContext.Provider value={{ isKeyboardActive: false }}>
            {children}
        </KeyboardContext.Provider>
    );
}

export function useKeyboard() {
    const context = useContext(KeyboardContext);
    return context;
}
