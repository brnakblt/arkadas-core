"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface CookiePreferences {
    necessary: boolean;
    functional: boolean;
    analytics: boolean;
    marketing: boolean;
}

interface CookieContextType {
    preferences: CookiePreferences;
    consentStatus: 'pending' | 'accepted' | 'declined' | 'custom' | null;
    togglePreference: (key: keyof CookiePreferences) => void;
    acceptAll: () => void;
    rejectAll: () => void; // Keeps necessary only
    savePreferences: () => void;
}

const CookieContext = createContext<CookieContextType | undefined>(undefined);

export function CookieProvider({ children }: { children: ReactNode }) {
    const [preferences, setPreferences] = useState<CookiePreferences>({
        necessary: true,
        functional: false,
        analytics: false,
        marketing: false,
    });

    // Status can be null (loading), 'pending' (show banner), or decided
    const [consentStatus, setConsentStatus] = useState<'pending' | 'accepted' | 'declined' | 'custom' | null>(null);

    useEffect(() => {
        // Load from localStorage on mount
        const savedConsent = localStorage.getItem("cookieConsent");
        const savedPreferences = localStorage.getItem("cookiePreferences");

        if (savedConsent) {
            setConsentStatus(savedConsent as 'pending' | 'accepted' | 'declined' | 'custom');
            if (savedPreferences) {
                try {
                    setPreferences(JSON.parse(savedPreferences));
                } catch (e) {
                    console.error("Failed to parse cookie preferences", e);
                }
            }
        } else {
            setConsentStatus('pending');
        }
    }, []);

    const saveToStorage = (prefs: CookiePreferences, status: string) => {
        localStorage.setItem("cookiePreferences", JSON.stringify(prefs));
        localStorage.setItem("cookieConsent", status);
        setConsentStatus(status as 'pending' | 'accepted' | 'declined' | 'custom');
        setPreferences(prefs);
    };

    const togglePreference = (key: keyof CookiePreferences) => {
        if (key === "necessary") return;
        setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const acceptAll = () => {
        const allAccepted: CookiePreferences = {
            necessary: true,
            functional: true,
            analytics: true,
            marketing: true,
        };
        saveToStorage(allAccepted, "accepted");
    };

    const rejectAll = () => {
        const onlyNecessary: CookiePreferences = {
            necessary: true,
            functional: false,
            analytics: false,
            marketing: false,
        };
        saveToStorage(onlyNecessary, "declined");
    };

    const savePreferences = () => {
        saveToStorage(preferences, "custom");
    };

    return (
        <CookieContext.Provider value={{
            preferences,
            consentStatus,
            togglePreference,
            acceptAll,
            rejectAll,
            savePreferences
        }}>
            {children}
        </CookieContext.Provider>
    );
}

export function useCookie() {
    const context = useContext(CookieContext);
    if (context === undefined) {
        throw new Error('useCookie must be used within a CookieProvider');
    }
    return context;
}
