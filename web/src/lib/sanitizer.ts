/* eslint-disable no-console */
/**
 * DOMPurify HTML Sanitizer Wrapper
 * 
 * Provides secure HTML sanitization using DOMPurify library.
 * This replaces the custom regex-based sanitizer for better XSS protection.
 * 
 * SECURITY FIX #5: Replace custom sanitizer with DOMPurify
 * 
 * Installation: npm install dompurify @types/dompurify
 */

// ============================================================
// Type Definitions
// ============================================================

/**
 * DOMPurify configuration options
 */
export interface SanitizeOptions {
    /** Allow specific HTML tags */
    allowedTags?: string[];
    /** Allow specific attributes */
    allowedAttributes?: string[];
    /** Allow data: URLs */
    allowDataUrls?: boolean;
    /** Return text only (strip all HTML) */
    textOnly?: boolean;
}

/**
 * Preset configurations for common use cases
 */
export const SanitizePresets = {
    /** Strip all HTML, return plain text */
    TEXT_ONLY: {
        textOnly: true,
    },
    /** Basic formatting (bold, italic, links) */
    BASIC: {
        allowedTags: ['b', 'i', 'u', 'strong', 'em', 'a', 'br', 'p'],
        allowedAttributes: ['href', 'title'],
    },
    /** Rich content (headings, lists, etc) */
    RICH: {
        allowedTags: [
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'p', 'br', 'hr',
            'ul', 'ol', 'li',
            'b', 'i', 'u', 'strong', 'em', 'mark',
            'a', 'blockquote', 'code', 'pre',
            'table', 'thead', 'tbody', 'tr', 'th', 'td',
            'img',
        ],
        allowedAttributes: ['href', 'src', 'alt', 'title', 'class'],
        allowDataUrls: false,
    },
} as const;

// ============================================================
// Fallback Sanitizer (when DOMPurify not available)
// ============================================================

/**
 * Basic fallback sanitizer using browser APIs
 * Used when DOMPurify is not installed
 */
function fallbackSanitize(html: string, options?: SanitizeOptions): string {
    if (options?.textOnly) {
        // Create temporary element and get text content
        if (typeof document !== 'undefined') {
            const temp = document.createElement('div');
            temp.innerHTML = html;
            return temp.textContent || temp.innerText || '';
        }
        // SSR fallback
        return html.replace(/<[^>]*>/g, '');
    }

    // Basic HTML entity encoding for untrusted content
    const escapeMap: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
    };

    return html.replace(/[&<>"']/g, (char) => escapeMap[char] || char);
}

// ============================================================
// Main Sanitizer
// ============================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let DOMPurify: any = null;

/**
 * Initialize DOMPurify (call once at app startup)
 */
export async function initSanitizer(): Promise<boolean> {
    if (typeof window === 'undefined') {
        console.debug('[Sanitizer] SSR environment, using fallback');
        return false;
    }

    try {
        DOMPurify = (await import('dompurify')).default;
        console.debug('[Sanitizer] DOMPurify initialized');
        return true;
    } catch (error) {
        console.warn('[Sanitizer] DOMPurify not available, using fallback:', error);
        return false;
    }
}

/**
 * Sanitize HTML string
 * 
 * @param dirty - Untrusted HTML string
 * @param options - Sanitization options
 * @returns Sanitized HTML string
 */
export function sanitize(dirty: string, options?: SanitizeOptions): string {
    if (!dirty || typeof dirty !== 'string') {
        return '';
    }

    // Text-only mode
    if (options?.textOnly) {
        if (DOMPurify) {
            return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [] });
        }
        return fallbackSanitize(dirty, options);
    }

    // Use DOMPurify if available
    if (DOMPurify) {
        const config: Record<string, unknown> = {};

        if (options?.allowedTags) {
            config.ALLOWED_TAGS = options.allowedTags;
        }

        if (options?.allowedAttributes) {
            config.ALLOWED_ATTR = options.allowedAttributes;
        }

        if (!options?.allowDataUrls) {
            config.FORBID_ATTR = ['onerror', 'onload', 'onclick'];
            config.FORBID_TAGS = ['script', 'style'];
        }

        return DOMPurify.sanitize(dirty, config);
    }

    // Fallback
    return fallbackSanitize(dirty, options);
}

/**
 * Check if a string contains potentially dangerous HTML
 */
export function hasDangerousHTML(html: string): boolean {
    const dangerous = [
        /<script\b/i,
        /javascript:/i,
        /on\w+\s*=/i, // onclick, onerror, etc.
        /<iframe\b/i,
        /<object\b/i,
        /<embed\b/i,
        /<form\b/i,
    ];

    return dangerous.some((pattern) => pattern.test(html));
}

/**
 * Sanitize and render HTML safely in React
 * Returns props for dangerouslySetInnerHTML
 */
export function createSafeHTML(
    html: string,
    options?: SanitizeOptions
): { __html: string } {
    return {
        __html: sanitize(html, options),
    };
}

// ============================================================
// React Hook
// ============================================================

import { useState, useEffect } from 'react';

/**
 * React hook for safe HTML rendering
 */
export function useSanitizedHTML(
    html: string,
    options?: SanitizeOptions
): { __html: string } {
    const [sanitized, setSanitized] = useState('');

    useEffect(() => {
        setSanitized(sanitize(html, options));
    }, [html, options]);

    return { __html: sanitized };
}

// ============================================================
// Export
// ============================================================

export default {
    initSanitizer,
    sanitize,
    hasDangerousHTML,
    createSafeHTML,
    useSanitizedHTML,
    SanitizePresets,
};
