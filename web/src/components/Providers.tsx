"use client";

import { ThemeProvider } from "next-themes";
import { ReactNode, useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { PolicyModalProvider } from "@/context/PolicyModalContext";
import { CookieProvider } from "@/context/CookieContext";
import { TwoFactorProvider } from "@/providers/TwoFactorProvider";
import { initMonitoring } from "@/lib/monitoring";
import ScrollToTop from "./ScrollToTop";

export function Providers({ children }: { children: ReactNode }) {
    const [mounted, setMounted] = useState(false);
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 60 * 1000,
                retry: 1,
            },
        },
    }));

    useEffect(() => {
        setMounted(true);

        // Initialize Sentry monitoring
        initMonitoring().catch(console.error);
    }, []);

    // QueryClientProvider is safe for SSR and required for prerendering components that use useQuery
    return (
        <QueryClientProvider client={queryClient}>
            {!mounted ? (
                <>{children}</>
            ) : (
                <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
                    <CookieProvider>
                        <TwoFactorProvider>
                            <PolicyModalProvider>
                                <ScrollToTop />
                                {children}
                            </PolicyModalProvider>
                        </TwoFactorProvider>
                    </CookieProvider>
                </ThemeProvider>
            )}
        </QueryClientProvider>
    );
}
