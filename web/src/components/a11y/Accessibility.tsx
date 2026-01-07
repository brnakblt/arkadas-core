'use client';

import { useEffect, useRef, useCallback } from 'react';

/**
 * Focus trap hook for modals and dialogs
 */
export function useFocusTrap(isActive: boolean = true) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isActive || !containerRef.current) return;

        const container = containerRef.current;
        const focusableElements = container.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        // Focus first element when trap activates
        firstElement.focus();

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key !== 'Tab') return;

            if (e.shiftKey) {
                // Shift + Tab
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                }
            } else {
                // Tab
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        };

        container.addEventListener('keydown', handleKeyDown);
        return () => container.removeEventListener('keydown', handleKeyDown);
    }, [isActive]);

    return containerRef;
}

/**
 * Skip to main content link
 */
export function SkipToContent({ targetId = 'main-content' }: { targetId?: string }) {
    return (
        <a
            href={`#${targetId}`}
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-500 focus:text-white focus:rounded-lg focus:outline-none"
        >
            Ana içeriğe geç
        </a>
    );
}

/**
 * Screen reader only text
 */
export function VisuallyHidden({ children }: { children: React.ReactNode }) {
    return <span className="sr-only">{children}</span>;
}

/**
 * Announce to screen readers
 */
export function useAnnounce() {
    const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', priority);
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = message;

        document.body.appendChild(announcement);

        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }, []);

    return announce;
}

/**
 * Reduced motion preference hook
 */
export function useReducedMotion(): boolean {
    if (typeof window === 'undefined') return false;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    return mediaQuery.matches;
}

/**
 * Focus management hook
 */
export function useFocusReturn() {
    const previousFocusRef = useRef<HTMLElement | null>(null);

    const saveFocus = useCallback(() => {
        previousFocusRef.current = document.activeElement as HTMLElement;
    }, []);

    const restoreFocus = useCallback(() => {
        if (previousFocusRef.current && previousFocusRef.current.focus) {
            previousFocusRef.current.focus();
        }
    }, []);

    return { saveFocus, restoreFocus };
}

/**
 * Live region for dynamic content announcements
 */
export function LiveRegion({
    children,
    priority = 'polite',
    atomic = true,
}: {
    children: React.ReactNode;
    priority?: 'polite' | 'assertive';
    atomic?: boolean;
}) {
    return (
        <div
            role="status"
            aria-live={priority}
            aria-atomic={atomic}
            className="sr-only"
        >
            {children}
        </div>
    );
}

/**
 * Progress indicator with ARIA
 */
export function AccessibleProgress({
    value,
    max = 100,
    label,
    className = '',
}: {
    value: number;
    max?: number;
    label: string;
    className?: string;
}) {
    const percentage = Math.round((value / max) * 100);

    return (
        <div className={className}>
            <div className="flex justify-between text-sm mb-1">
                <span>{label}</span>
                <span>%{percentage}</span>
            </div>
            <div
                role="progressbar"
                aria-valuenow={value}
                aria-valuemin={0}
                aria-valuemax={max}
                aria-label={label}
                className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
            >
                <div
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}

/**
 * Accessible loading spinner
 */
export function AccessibleSpinner({ label = 'Yükleniyor' }: { label?: string }) {
    return (
        <div role="status" aria-label={label}>
            <span className="sr-only">{label}</span>
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );
}
