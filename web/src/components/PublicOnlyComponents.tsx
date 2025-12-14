"use client";

import { usePathname } from 'next/navigation';
import CookieConsent from './CookieConsent';
import AccessibilityMenu from './AccessibilityMenu';

/**
 * Components that should only appear on the public website,
 * not on dashboard, admin, or authenticated areas.
 */
const PublicOnlyComponents: React.FC = () => {
    const pathname = usePathname();

    // Paths where these components should NOT appear
    const excludedPaths = [
        '/dashboard',
        '/admin',
        '/auth',
        '/reports',
        '/yoklama',
        '/servis-takip',
        '/program',
    ];

    // Check if current path starts with any excluded path
    const isExcluded = excludedPaths.some(path => pathname?.startsWith(path));

    if (isExcluded) {
        return null;
    }

    return (
        <>
            <CookieConsent />
            <AccessibilityMenu />
        </>
    );
};

export default PublicOnlyComponents;
