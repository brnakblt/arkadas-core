import { Metadata } from 'next';

interface SEOProps {
    title: string;
    description?: string;
    keywords?: string[];
    image?: string;
    url?: string;
    type?: 'website' | 'article';
    noIndex?: boolean;
}

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://admin.arkadasozelegitim.com';
const DEFAULT_IMAGE = '/images/og-image.jpg';
const SITE_NAME = 'Arkadaş Özel Eğitim ERP';

/**
 * Generate metadata for a page
 */
export function generateSEO({
    title,
    description = 'Arkadaş Özel Eğitim ve Rehabilitasyon Merkezi ERP Sistemi',
    keywords = ['eğitim', 'özel eğitim', 'ERP', 'yoklama', 'servis takip'],
    image = DEFAULT_IMAGE,
    url = '/',
    type = 'website',
    noIndex = false,
}: SEOProps): Metadata {
    const fullTitle = `${title} | ${SITE_NAME}`;
    const fullUrl = `${BASE_URL}${url}`;
    const fullImage = image.startsWith('http') ? image : `${BASE_URL}${image}`;

    return {
        title: fullTitle,
        description,
        keywords: keywords.join(', '),
        authors: [{ name: 'Arkadaş Özel Eğitim' }],
        creator: 'Arkadaş Özel Eğitim',
        publisher: 'Arkadaş Özel Eğitim',
        robots: noIndex
            ? { index: false, follow: false }
            : { index: true, follow: true },
        alternates: {
            canonical: fullUrl,
        },
        openGraph: {
            type,
            locale: 'tr_TR',
            url: fullUrl,
            title: fullTitle,
            description,
            siteName: SITE_NAME,
            images: [
                {
                    url: fullImage,
                    width: 1200,
                    height: 630,
                    alt: title,
                },
            ],
        },
        twitter: {
            card: 'summary_large_image',
            title: fullTitle,
            description,
            images: [fullImage],
        },
    };
}

/**
 * Default metadata for the site
 */
export const defaultMetadata: Metadata = {
    metadataBase: new URL(BASE_URL),
    title: {
        default: SITE_NAME,
        template: `%s | ${SITE_NAME}`,
    },
    description: 'Arkadaş Özel Eğitim ve Rehabilitasyon Merkezi ERP Sistemi - Yoklama, Servis Takip, Program Yönetimi',
    keywords: ['özel eğitim', 'rehabilitasyon', 'ERP', 'yoklama sistemi', 'servis takip', 'yüz tanıma'],
    authors: [{ name: 'Arkadaş Özel Eğitim' }],
    creator: 'Arkadaş Özel Eğitim',
    publisher: 'Arkadaş Özel Eğitim',
    robots: { index: true, follow: true },
    icons: {
        icon: '/favicon.ico',
        shortcut: '/icons/icon-192x192.png',
        apple: '/icons/apple-touch-icon.png',
    },
    manifest: '/manifest.json',
    openGraph: {
        type: 'website',
        locale: 'tr_TR',
        url: BASE_URL,
        siteName: SITE_NAME,
        images: [
            {
                url: `${BASE_URL}${DEFAULT_IMAGE}`,
                width: 1200,
                height: 630,
                alt: SITE_NAME,
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        creator: '@arkadasozelegitim',
    },
    verification: {
        google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    },
};

/**
 * JSON-LD Schema for Organization
 */
export function OrganizationSchema() {
    const schema = {
        '@context': 'https://schema.org',
        '@type': 'EducationalOrganization',
        name: 'Arkadaş Özel Eğitim ve Rehabilitasyon Merkezi',
        url: BASE_URL,
        logo: `${BASE_URL}/images/logo.png`,
        contactPoint: {
            '@type': 'ContactPoint',
            telephone: '+90-212-123-4567',
            contactType: 'customer service',
            availableLanguage: 'Turkish',
        },
        address: {
            '@type': 'PostalAddress',
            addressLocality: 'İstanbul',
            addressCountry: 'TR',
        },
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    );
}

/**
 * Breadcrumb Schema
 */
export function BreadcrumbSchema({ items }: { items: { name: string; url: string }[] }) {
    const schema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: `${BASE_URL}${item.url}`,
        })),
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    );
}
