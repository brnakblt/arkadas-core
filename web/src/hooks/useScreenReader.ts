/* eslint-disable no-console */
import { useEffect, useCallback, useRef } from 'react';
import { useTTS } from './useTTS';

/**
 * Screen Reader Hook for WCAG 2.2 AAA Compliance
 * - Reads focused elements aloud when blind mode is active
 * - All focusable elements read on Tab navigation
 * - Click on any text to hear it read
 */
export function useScreenReader(isActive: boolean) {
    const { speak, stop } = useTTS();
    const lastSpokenRef = useRef<string>('');
    const wasActiveRef = useRef(false);

    /**
     * Get accessible name following WAI-ARIA spec
     */
    const getAccessibleName = useCallback((element: HTMLElement): string => {
        // aria-label
        const ariaLabel = element.getAttribute('aria-label');
        if (ariaLabel) return ariaLabel;

        // aria-labelledby
        const ariaLabelledBy = element.getAttribute('aria-labelledby');
        if (ariaLabelledBy) {
            const labelElement = document.getElementById(ariaLabelledBy);
            if (labelElement?.textContent) {
                return labelElement.textContent.trim();
            }
        }

        // alt (for images)
        if (element instanceof HTMLImageElement && element.alt) {
            return `Resim: ${element.alt}`;
        }

        // title
        const title = element.getAttribute('title');
        if (title) return title;

        // For form elements
        if (element instanceof HTMLInputElement || element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement) {
            const id = element.id;
            if (id) {
                const label = document.querySelector(`label[for="${id}"]`);
                if (label?.textContent) {
                    return label.textContent.trim();
                }
            }
            const placeholder = element.getAttribute('placeholder');
            if (placeholder) return placeholder;
        }

        // For buttons - get clean text
        if (element instanceof HTMLButtonElement || element.getAttribute('role') === 'button') {
            const text = element.textContent?.trim();
            if (text && text.length < 100) return text;
        }

        // For links
        if (element instanceof HTMLAnchorElement) {
            const text = element.textContent?.trim();
            if (text && text.length < 100) return text;
        }

        // Default to text content (limit length)
        const textContent = element.textContent?.trim();
        if (textContent && textContent.length < 100) {
            return textContent;
        }

        return '';
    }, []);

    /**
     * Get element type description in Turkish
     */
    const getElementType = useCallback((element: HTMLElement): string => {
        const tagName = element.tagName.toLowerCase();
        const role = element.getAttribute('role');

        if (role === 'button' || tagName === 'button') return 'Buton';
        if (tagName === 'a') return 'Link';
        if (tagName === 'input') {
            const type = (element as HTMLInputElement).type;
            if (type === 'text' || type === 'email' || type === 'password') return 'Metin alanı';
            if (type === 'checkbox') return 'Onay kutusu';
            if (type === 'radio') return 'Seçenek';
            if (type === 'submit') return 'Gönder butonu';
            return 'Giriş alanı';
        }
        if (tagName === 'select') return 'Seçim listesi';
        if (tagName === 'textarea') return 'Metin alanı';
        return '';
    }, []);

    // Handle focus events - READ ALL FOCUSABLE ELEMENTS ON TAB
    const handleFocus = useCallback((event: FocusEvent) => {
        const target = event.target as HTMLElement;
        if (!target || target === document.body) return;

        // Skip accessibility menu
        if (target.closest('[data-accessibility-menu="true"]')) {
            return;
        }

        stop();

        const accessibleName = getAccessibleName(target);
        const elementType = getElementType(target);

        let textToSpeak = '';
        if (accessibleName) {
            textToSpeak = elementType ? `${elementType}: ${accessibleName}` : accessibleName;
        } else if (elementType) {
            textToSpeak = elementType;
        }

        if (textToSpeak && textToSpeak !== lastSpokenRef.current) {
            lastSpokenRef.current = textToSpeak;
            console.debug('[ScreenReader] Focus reading:', textToSpeak);
            speak(textToSpeak);
        }
    }, [getAccessibleName, getElementType, speak, stop]);

    // Handle click events - for non-focusable text elements
    const handleClick = useCallback((event: MouseEvent) => {
        const target = event.target as HTMLElement;
        if (!target || target === document.body) return;

        // Skip accessibility menu
        if (target.closest('[data-accessibility-menu="true"]')) {
            return;
        }

        // Skip if this is already a focusable element (handled by focus event)
        const tagName = target.tagName.toLowerCase();
        if (['button', 'a', 'input', 'select', 'textarea'].includes(tagName) ||
            target.getAttribute('role') === 'button' ||
            target.hasAttribute('tabindex')) {
            return;
        }

        // For non-interactive elements, read the text
        stop();

        const textContent = target.textContent?.trim();
        if (textContent && textContent.length > 0 && textContent.length < 500) {
            if (textContent !== lastSpokenRef.current) {
                lastSpokenRef.current = textContent;
                console.debug('[ScreenReader] Click reading:', textContent.substring(0, 50) + '...');
                speak(textContent);
            }
        }
    }, [speak, stop]);

    // Setup/cleanup based on isActive
    useEffect(() => {
        // Announce state changes
        if (isActive && !wasActiveRef.current) {
            wasActiveRef.current = true;
            speak('Görme engelli profili aktif. Tab ile gezinin. Çıkmak için Escape tuşuna basın.');
        } else if (!isActive && wasActiveRef.current) {
            wasActiveRef.current = false;
            stop();
            speak('Görme engelli profili kapatıldı.');
        }

        if (!isActive) {
            return;
        }

        console.debug('[ScreenReader] Adding listeners');
        document.addEventListener('focusin', handleFocus);
        document.addEventListener('click', handleClick);

        return () => {
            console.debug('[ScreenReader] Removing listeners');
            document.removeEventListener('focusin', handleFocus);
            document.removeEventListener('click', handleClick);
        };
    }, [isActive, handleFocus, handleClick, speak, stop]);

    return { isActive };
}
