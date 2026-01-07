"use client";

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';

const CookieConsent = dynamic(() => import('./CookieConsent'), { ssr: false });
const AccessibilityMenu = dynamic(() => import('./AccessibilityMenu'), { ssr: false });

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
