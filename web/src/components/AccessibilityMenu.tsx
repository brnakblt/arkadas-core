"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faUniversalAccess,
    faEyeSlash,
    faBolt,
    faLightbulb,
    faDna,
    faFont,
    faUser,
    faTimes
} from "@fortawesome/free-solid-svg-icons";

import { useTTS } from "@/hooks/useTTS";
import { useScreenReader } from "@/hooks/useScreenReader";

type AccessibilityProfile = "seizure" | "vision" | "adhd" | "blind" | "dyslexia" | "elderly" | null;

const AccessibilityMenu: React.FC = () => {
    const { speak, isLoading, progress } = useTTS();
    const [isOpen, setIsOpen] = useState(false);
    const [activeProfile, setActiveProfile] = useState<AccessibilityProfile>(null);

    // Refs for focus management
    const menuRef = useRef<HTMLDivElement>(null);
    const toggleButtonRef = useRef<HTMLButtonElement>(null);
    const firstFocusableRef = useRef<HTMLButtonElement>(null);

    // Activate screen reader when blind profile is enabled
    useScreenReader(activeProfile === 'blind');

    // Apply styles based on active profile
    useEffect(() => {
        document.body.classList.remove(
            "acc-seizure",
            "acc-vision",
            "acc-adhd",
            "acc-blind",
            "acc-dyslexia",
            "acc-elderly"
        );

        if (activeProfile) {
            document.body.classList.add(`acc-${activeProfile}`);
        }
    }, [activeProfile]);

    // Global Escape to exit blind mode
    useEffect(() => {
        if (activeProfile !== 'blind') return;

        const handleGlobalEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !isOpen) {
                event.preventDefault();
                event.stopImmediatePropagation();
                setActiveProfile(null);
                // speak() call removed to prevent double audio (handled by useScreenReader)
            }
        };

        document.addEventListener('keydown', handleGlobalEscape);
        return () => document.removeEventListener('keydown', handleGlobalEscape);
    }, [activeProfile, isOpen]);

    // Focus trap: Keep Tab within menu when open
    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        if (!isOpen) return;

        // Close on Escape
        if (event.key === 'Escape') {
            event.preventDefault();
            event.stopImmediatePropagation();
            setIsOpen(false);
            toggleButtonRef.current?.focus();
            return;
        }

        // Focus trap on Tab
        if (event.key === 'Tab') {
            const focusableElements = menuRef.current?.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );

            if (!focusableElements || focusableElements.length === 0) return;

            const firstElement = focusableElements[0] as HTMLElement;
            const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

            if (event.shiftKey) {
                if (document.activeElement === firstElement) {
                    event.preventDefault();
                    lastElement.focus();
                }
            } else {
                if (document.activeElement === lastElement) {
                    event.preventDefault();
                    firstElement.focus();
                }
            }
        }
    }, [isOpen]);

    // Global focus trap for blind mode
    useEffect(() => {
        if (activeProfile !== 'blind') return;

        const handleGlobalTab = (event: KeyboardEvent) => {
            if (event.key !== 'Tab') return;

            const mainContent = document.querySelector('main') || document.body;
            const focusableElements = mainContent.querySelectorAll(
                'button:not([data-acc-toggle] button), ' +
                'a[href], input, select, textarea, ' +
                '[tabindex]:not([tabindex="-1"]):not([data-acc-toggle] *)'
            );

            if (focusableElements.length === 0) return;

            const firstElement = focusableElements[0] as HTMLElement;
            const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

            const isInMenu = document.activeElement?.closest('[data-acc-toggle]');
            if (isInMenu) return;

            if (event.shiftKey && document.activeElement === firstElement) {
                event.preventDefault();
                lastElement.focus();
            } else if (!event.shiftKey && document.activeElement === lastElement) {
                event.preventDefault();
                firstElement.focus();
            }
        };

        document.addEventListener('keydown', handleGlobalTab);
        return () => document.removeEventListener('keydown', handleGlobalTab);
    }, [activeProfile]);

    // Menu keyboard handling
    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    // Focus first item when menu opens
    useEffect(() => {
        if (isOpen && firstFocusableRef.current) {
            setTimeout(() => firstFocusableRef.current?.focus(), 100);
        }
    }, [isOpen]);

    const handleProfileSelect = (profile: AccessibilityProfile) => {
        const newProfile = activeProfile === profile ? null : profile;
        setActiveProfile(newProfile);

        // Close menu when blind profile is selected
        // Announcement is handled by useScreenReader hook
        if (profile === 'blind' && newProfile === 'blind') {
            setIsOpen(false);
        }
    };

    const menuItems = [
        {
            id: "seizure",
            label: "Nöbet Güvenli Profili",
            icon: faBolt,
            description: "Yanıp sönen ışıkları azaltır.",
        },
        {
            id: "vision",
            label: "Kısıtlı Görme Profili",
            icon: faEyeSlash,
            description: "Kontrastı artırır.",
        },
        {
            id: "adhd",
            label: "Dikkat Eksikliği Profili",
            icon: faLightbulb,
            description: "Okuma maskesi sağlar.",
        },
        {
            id: "blind",
            label: "Görme Engelli Profili",
            icon: faUser,
            description: "Sesli geri bildirim verir.",
        },
        {
            id: "dyslexia",
            label: "Disleksi Profili",
            icon: faDna,
            description: "Okunaklı yazı tipi kullanır.",
        },
        {
            id: "elderly",
            label: "Yaşlılık Profili",
            icon: faFont,
            description: "Yazı boyutlarını büyütür.",
        },
    ];

    return (
        <>
            {/* Floating Toggle Button */}
            <button
                ref={toggleButtonRef}
                onClick={() => setIsOpen(!isOpen)}
                style={{ bottom: '1.5rem', left: '1.5rem' }}
                className={`fixed z-[10000] w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${isOpen
                    ? "bg-primary text-white scale-110 ring-4 ring-primary/30"
                    : "bg-gradient-to-br from-primary to-green-600 text-white hover:scale-105 hover:shadow-xl"
                    }`}
                aria-label="Erişilebilirlik Menüsü"
                aria-expanded={isOpen}
                aria-controls="accessibility-menu"
                data-acc-toggle="true"
            >
                <FontAwesomeIcon icon={faUniversalAccess} className="w-7 h-7" />
            </button>

            {/* Backdrop for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-[9999] md:hidden"
                    onClick={() => setIsOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* Menu Panel - Centered on mobile, positioned on desktop */}
            <div
                ref={menuRef}
                id="accessibility-menu"
                role="dialog"
                aria-label="Erişilebilirlik Ayarları"
                aria-modal="true"
                className={`fixed z-[10000] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden transition-all duration-300
                    /* Mobile: centered like cookie modal */
                    inset-x-4 top-1/2 -translate-y-1/2 max-w-sm mx-auto
                    /* Desktop: positioned bottom-left */
                    md:inset-x-auto md:top-auto md:translate-y-0 md:bottom-24 md:left-6 md:mx-0 md:w-80
                    ${isOpen
                        ? "opacity-100 scale-100 pointer-events-auto"
                        : "opacity-0 scale-95 pointer-events-none"
                    }`}
            >
                {/* Header */}
                <div className="p-4 bg-gradient-to-r from-primary to-green-600 text-white flex justify-between items-center">
                    {isLoading && (
                        <div className="absolute inset-0 bg-white/80 z-50 flex items-center justify-center gap-2">
                            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-sm font-medium text-primary">
                                {progress ? `%${progress.toFixed(0)}` : 'Yükleniyor...'}
                            </span>
                        </div>
                    )}
                    <h2 className="font-bold text-lg">Erişilebilirlik</h2>
                    <button
                        ref={firstFocusableRef}
                        onClick={() => setIsOpen(false)}
                        className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                        aria-label="Menüyü Kapat"
                    >
                        <FontAwesomeIcon icon={faTimes} className="w-4 h-4" />
                    </button>
                </div>

                {/* Menu Items - NO data-accessibility-menu so TTS reads them */}
                <nav aria-label="Erişilebilirlik Profilleri">
                    <ul className="p-3 space-y-2 max-h-[50vh] overflow-y-auto">
                        {menuItems.map((item) => (
                            <li key={item.id}>
                                <button
                                    onClick={() => handleProfileSelect(item.id as AccessibilityProfile)}
                                    className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all duration-200 text-left group ${activeProfile === item.id
                                        ? "bg-primary/10 ring-2 ring-primary"
                                        : "bg-gray-50 hover:bg-gray-100"
                                        }`}
                                    aria-pressed={activeProfile === item.id}
                                    aria-label={`${item.label}. ${item.description}${activeProfile === item.id ? ' Aktif.' : ''}`}
                                >
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${activeProfile === item.id
                                        ? "bg-primary text-white"
                                        : "bg-white shadow-sm text-gray-500 group-hover:text-primary"
                                        }`}>
                                        <FontAwesomeIcon icon={item.icon} className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className={`font-semibold text-sm truncate ${activeProfile === item.id ? "text-primary" : "text-gray-700"
                                            }`}>
                                            {item.label}
                                        </div>
                                        <div className="text-xs text-gray-500 truncate">
                                            {item.description}
                                        </div>
                                    </div>
                                    {activeProfile === item.id && (
                                        <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center">
                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    )}
                                </button>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* Footer */}
                <div className="p-3 border-t border-gray-100 bg-gray-50">
                    <button
                        onClick={() => setActiveProfile(null)}
                        className="w-full py-2 px-4 text-sm text-gray-600 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        aria-label="Tüm erişilebilirlik ayarlarını sıfırla"
                    >
                        Tüm Ayarları Sıfırla
                    </button>
                </div>
            </div>
        </>
    );
};

export default AccessibilityMenu;
