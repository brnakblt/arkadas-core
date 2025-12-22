'use client';

import { useEffect, useCallback, createContext, useContext, ReactNode, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';

interface Shortcut {
    key: string;
    ctrl?: boolean;
    alt?: boolean;
    shift?: boolean;
    description: string;
    action: () => void;
}

interface KeyboardContextType {
    shortcuts: Shortcut[];
    registerShortcut: (shortcut: Shortcut) => void;
    unregisterShortcut: (key: string) => void;
    showShortcutsPanel: boolean;
    toggleShortcutsPanel: () => void;
}

const KeyboardContext = createContext<KeyboardContextType | null>(null);

export function useKeyboard() {
    const context = useContext(KeyboardContext);
    if (!context) {
        throw new Error('useKeyboard must be used within KeyboardProvider');
    }
    return context;
}

/**
 * Global Keyboard Shortcuts Provider
 */
export function KeyboardProvider({ children }: { children: ReactNode }) {
    const router = useRouter();
    const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
    const [showShortcutsPanel, setShowShortcutsPanel] = useState(false);

    // Default shortcuts
    const defaultShortcuts: Shortcut[] = useMemo(() => [
        {
            key: '/',
            description: 'Arama',
            action: () => document.querySelector<HTMLInputElement>('[data-search]')?.focus(),
        },
        {
            key: 'h',
            alt: true,
            description: 'Ana Sayfa',
            action: () => router.push('/'),
        },
        {
            key: 'y',
            alt: true,
            description: 'Yoklama',
            action: () => router.push('/yoklama'),
        },
        {
            key: 'p',
            alt: true,
            description: 'Program',
            action: () => router.push('/program'),
        },
        {
            key: 's',
            alt: true,
            description: 'Servis Takip',
            action: () => router.push('/servis-takip'),
        },
        {
            key: '?',
            shift: true,
            description: 'Kısayolları Göster',
            action: () => setShowShortcutsPanel((prev) => !prev),
        },
        {
            key: 'Escape',
            description: 'Paneli Kapat',
            action: () => setShowShortcutsPanel(false),
        },
    ], [router]);

    const registerShortcut = useCallback((shortcut: Shortcut) => {
        setShortcuts((prev) => [...prev.filter((s) => s.key !== shortcut.key), shortcut]);
    }, []);

    const unregisterShortcut = useCallback((key: string) => {
        setShortcuts((prev) => prev.filter((s) => s.key !== key));
    }, []);

    const toggleShortcutsPanel = useCallback(() => {
        setShowShortcutsPanel((prev) => !prev);
    }, []);

    // Handle keyboard events
    useEffect(() => {
        const allShortcuts = [...defaultShortcuts, ...shortcuts];

        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if typing in an input
            const target = e.target as HTMLElement;
            if (
                target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.isContentEditable
            ) {
                // Still allow Escape
                if (e.key !== 'Escape') return;
            }

            for (const shortcut of allShortcuts) {
                const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();
                const ctrlMatch = shortcut.ctrl ? e.ctrlKey || e.metaKey : !e.ctrlKey && !e.metaKey;
                const altMatch = shortcut.alt ? e.altKey : !e.altKey;
                const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;

                if (keyMatch && ctrlMatch && altMatch && shiftMatch) {
                    e.preventDefault();
                    shortcut.action();
                    return;
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [shortcuts, defaultShortcuts]);

    const allDisplayShortcuts = [...defaultShortcuts, ...shortcuts];

    return (
        <KeyboardContext.Provider
            value={{
                shortcuts: allDisplayShortcuts,
                registerShortcut,
                unregisterShortcut,
                showShortcutsPanel,
                toggleShortcutsPanel,
            }}
        >
            {children}

            {/* Shortcuts Panel */}
            {showShortcutsPanel && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
                    onClick={() => setShowShortcutsPanel(false)}
                >
                    <div
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-4 border-b dark:border-gray-700">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                ⌨️ Klavye Kısayolları
                            </h2>
                        </div>
                        <div className="p-4 max-h-96 overflow-y-auto">
                            <div className="space-y-2">
                                {allDisplayShortcuts.map((shortcut, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between py-2 px-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg"
                                    >
                                        <span className="text-gray-600 dark:text-gray-300">
                                            {shortcut.description}
                                        </span>
                                        <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-600 rounded text-sm font-mono text-gray-700 dark:text-gray-200">
                                            {shortcut.ctrl && 'Ctrl+'}
                                            {shortcut.alt && 'Alt+'}
                                            {shortcut.shift && 'Shift+'}
                                            {shortcut.key.toUpperCase()}
                                        </kbd>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="p-4 border-t dark:border-gray-700 text-center text-sm text-gray-500">
                            <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-600 rounded text-xs">
                                Shift+?
                            </kbd>{' '}
                            ile bu paneli açabilirsiniz
                        </div>
                    </div>
                </div>
            )}
        </KeyboardContext.Provider>
    );
}

/**
 * Keyboard Shortcut Indicator Button
 */
export function KeyboardShortcutHint({ className = '' }: { className?: string }) {
    const { toggleShortcutsPanel } = useKeyboard();

    return (
        <button
            onClick={toggleShortcutsPanel}
            className={`p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${className}`}
            title="Klavye Kısayolları (Shift+?)"
        >
            ⌨️
        </button>
    );
}
