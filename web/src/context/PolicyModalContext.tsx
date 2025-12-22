"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import PolicyModal from '@/components/PolicyModal';

type PolicyView = 'cookie' | 'kvkk';

interface PolicyModalContextType {
    openPolicyModal: (view: PolicyView) => void;
    closePolicyModal: () => void;
}

const PolicyModalContext = createContext<PolicyModalContextType | undefined>(undefined);

export function PolicyModalProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [view, setView] = useState<PolicyView>('cookie');

    const openPolicyModal = (view: PolicyView) => {
        setView(view);
        setIsOpen(true);
    };

    const closePolicyModal = () => {
        setIsOpen(false);
    };

    return (
        <PolicyModalContext.Provider value={{ openPolicyModal, closePolicyModal }}>
            {children}
            <PolicyModal isOpen={isOpen} view={view} onClose={closePolicyModal} />
        </PolicyModalContext.Provider>
    );
}

export function usePolicyModal() {
    const context = useContext(PolicyModalContext);
    if (context === undefined) {
        throw new Error('usePolicyModal must be used within a PolicyModalProvider');
    }
    return context;
}
