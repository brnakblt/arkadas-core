'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Tenant {
    id: number;
    slug: string;
    name: string;
    displayName: string;
    logo?: string;
    settings?: Record<string, unknown>;
}

interface TenantContextType {
    tenant: Tenant | null;
    tenantSlug: string;
    isLoading: boolean;
    setTenantSlug: (slug: string) => void;
    getTenantHeader: () => Record<string, string>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

// Get tenant from subdomain or environment
function detectTenantSlug(): string {
    // Server-side or during hydration
    if (typeof window === 'undefined') {
        return process.env.NEXT_PUBLIC_DEFAULT_TENANT || 'arkadas';
    }

    // Check subdomain first
    const hostname = window.location.hostname;
    const parts = hostname.split('.');

    // subdomain.domain.tld format
    if (parts.length >= 3) {
        const subdomain = parts[0];
        if (!['www', 'app', 'admin', 'api'].includes(subdomain)) {
            return subdomain;
        }
    }

    // Check localStorage for tenant preference
    const storedTenant = localStorage.getItem('tenant_slug');
    if (storedTenant) {
        return storedTenant;
    }

    // Fall back to default
    return process.env.NEXT_PUBLIC_DEFAULT_TENANT || 'arkadas';
}

interface TenantProviderProps {
    children: ReactNode;
    initialTenant?: string;
}

export function TenantProvider({ children, initialTenant }: TenantProviderProps) {
    const [tenantSlug, setTenantSlugState] = useState<string>(initialTenant || detectTenantSlug());
    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch tenant info from API
    useEffect(() => {
        async function fetchTenant() {
            if (!tenantSlug) return;

            setIsLoading(true);
            try {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337'}/api/tenants?filters[slug][$eq]=${tenantSlug}`,
                    {
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    }
                );

                if (response.ok) {
                    const data = await response.json();
                    if (data.data && data.data.length > 0) {
                        const tenantData = data.data[0];
                        setTenant({
                            id: tenantData.id,
                            slug: tenantData.slug,
                            name: tenantData.name,
                            displayName: tenantData.displayName || tenantData.name,
                            logo: tenantData.logo?.url,
                            settings: tenantData.settings,
                        });
                    }
                }
            } catch (error) {
                console.error('Failed to fetch tenant:', error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchTenant();
    }, [tenantSlug]);

    const setTenantSlug = (slug: string) => {
        setTenantSlugState(slug);
        if (typeof window !== 'undefined') {
            localStorage.setItem('tenant_slug', slug);
        }
    };

    // Get x-tenant-id header for API requests
    const getTenantHeader = () => ({
        'x-tenant-id': tenantSlug,
    });

    return (
        <TenantContext.Provider value={{
            tenant,
            tenantSlug,
            isLoading,
            setTenantSlug,
            getTenantHeader
        }}>
            {children}
        </TenantContext.Provider>
    );
}

export function useTenant() {
    const context = useContext(TenantContext);
    if (context === undefined) {
        throw new Error('useTenant must be used within a TenantProvider');
    }
    return context;
}

// Hook to get tenant-aware fetch function
export function useTenantFetch() {
    const { tenantSlug } = useTenant();

    return async (url: string, options: RequestInit = {}) => {
        const headers = {
            ...options.headers,
            'x-tenant-id': tenantSlug,
        };

        return fetch(url, { ...options, headers });
    };
}
