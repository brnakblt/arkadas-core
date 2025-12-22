'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
    theme: Theme;
    effectiveTheme: 'light' | 'dark';
    setTheme: (theme: Theme) => void;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<Theme>('system');
    const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>('light');

    // Load theme from localStorage on mount
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') as Theme | null;
        if (savedTheme) {
            setThemeState(savedTheme);
        }
    }, []);

    // Update effective theme based on theme setting and system preference
    useEffect(() => {
        const updateEffectiveTheme = () => {
            let effective: 'light' | 'dark';

            if (theme === 'system') {
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                effective = prefersDark ? 'dark' : 'light';
            } else {
                effective = theme;
            }

            setEffectiveTheme(effective);

            // Update document class for Tailwind dark mode
            if (effective === 'dark') {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        };

        updateEffectiveTheme();

        // Listen for system theme changes
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = () => {
            if (theme === 'system') {
                updateEffectiveTheme();
            }
        };

        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, [theme]);

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        localStorage.setItem('theme', newTheme);
    };

    const toggleTheme = () => {
        const newTheme = effectiveTheme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
    };

    return (
        <ThemeContext.Provider value={{ theme, effectiveTheme, setTheme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

/**
 * Theme Toggle Button Component
 */
export function ThemeToggle({ className = '' }: { className?: string }) {
    const { effectiveTheme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className={`p-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 ${className}`}
            aria-label={effectiveTheme === 'dark' ? 'Açık moda geç' : 'Koyu moda geç'}
        >
            {effectiveTheme === 'dark' ? (
                <span className="text-xl">☀️</span>
            ) : (
                <span className="text-xl">🌙</span>
            )}
        </button>
    );
}

/**
 * Theme Selector with all options
 */
export function ThemeSelector({ className = '' }: { className?: string }) {
    const { theme, setTheme } = useTheme();

    const options: { value: Theme; label: string; icon: string }[] = [
        { value: 'light', label: 'Açık', icon: '☀️' },
        { value: 'dark', label: 'Koyu', icon: '🌙' },
        { value: 'system', label: 'Sistem', icon: '💻' },
    ];

    return (
        <div className={`flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg ${className}`}>
            {options.map((option) => (
                <button
                    key={option.value}
                    onClick={() => setTheme(option.value)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors ${theme === option.value
                            ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                >
                    <span>{option.icon}</span>
                    <span>{option.label}</span>
                </button>
            ))}
        </div>
    );
}
