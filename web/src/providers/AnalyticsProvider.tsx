'use client';

import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';

// Environment variables
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';

/**
 * Google Analytics 4 Component
 */
export function GoogleAnalytics() {
    if (!GA_ID) return null;

    return (
        <>
            <Script
                src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
                strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
                {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', {
            page_path: window.location.pathname,
          });
        `}
            </Script>
        </>
    );
}

/**
 * Track page views for Google Analytics
 */
function GoogleAnalyticsPageView() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        if (!GA_ID) return;

        const url = pathname + searchParams.toString();

        // @ts-expect-error - gtag is loaded dynamically
        if (typeof window.gtag === 'function') {
            // @ts-expect-error - gtag is loaded dynamically
            window.gtag('config', GA_ID, {
                page_path: url,
            });
        }
    }, [pathname, searchParams]);

    return null;
}

/**
 * PostHog Analytics Component
 */
export function PostHogAnalytics() {
    if (!POSTHOG_KEY) return null;

    return (
        <Script id="posthog" strategy="afterInteractive">
            {`
        !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
        posthog.init('${POSTHOG_KEY}', {
          api_host: '${POSTHOG_HOST}',
          loaded: function(posthog) {
            if (process.env.NODE_ENV === 'development') {
              posthog.opt_out_capturing();
            }
          }
        });
      `}
        </Script>
    );
}

/**
 * Analytics Provider - includes all analytics scripts
 */
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
    return (
        <>
            <GoogleAnalytics />
            <PostHogAnalytics />
            <Suspense fallback={null}>
                <GoogleAnalyticsPageView />
            </Suspense>
            {children}
        </>
    );
}

/**
 * Track custom events
 */
export function trackEvent(
    eventName: string,
    properties?: Record<string, unknown>
) {
    // Google Analytics
    if (typeof window !== 'undefined' && GA_ID) {
        // @ts-expect-error - gtag is loaded dynamically
        if (typeof window.gtag === 'function') {
            // @ts-expect-error - gtag is loaded dynamically
            window.gtag('event', eventName, properties);
        }
    }

    // PostHog
    if (typeof window !== 'undefined' && POSTHOG_KEY) {
        // @ts-expect-error - posthog is loaded dynamically
        if (typeof window.posthog === 'object') {
            // @ts-expect-error - posthog is loaded dynamically
            window.posthog.capture(eventName, properties);
        }
    }
}

/**
 * Common event tracking helpers
 */
export const analytics = {
    // User events
    login: (method: string) => trackEvent('login', { method }),
    logout: () => trackEvent('logout'),
    signup: (method: string) => trackEvent('sign_up', { method }),

    // Attendance events
    checkIn: (studentId: string, method: string) =>
        trackEvent('attendance_check_in', { student_id: studentId, method }),
    checkOut: (studentId: string) =>
        trackEvent('attendance_check_out', { student_id: studentId }),

    // Service tracking events
    startTracking: (routeId: string) =>
        trackEvent('service_tracking_start', { route_id: routeId }),
    stopTracking: (routeId: string) =>
        trackEvent('service_tracking_stop', { route_id: routeId }),

    // Document events
    documentView: (docId: string, docName: string) =>
        trackEvent('document_view', { doc_id: docId, doc_name: docName }),
    documentDownload: (docId: string, docName: string) =>
        trackEvent('document_download', { doc_id: docId, doc_name: docName }),

    // Search events
    search: (query: string, resultsCount: number) =>
        trackEvent('search', { query, results_count: resultsCount }),

    // Error tracking
    error: (errorMessage: string, errorStack?: string) =>
        trackEvent('error', { message: errorMessage, stack: errorStack }),
};
