"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function ScrollToTop() {
    const pathname = usePathname();

    useEffect(() => {
        // Force scroll to top on mount and route change
        window.scrollTo(0, 0);

        // Also try to disable browser duplicate scroll restoration if needed
        if ('scrollRestoration' in history) {
            history.scrollRestoration = 'manual';
        }
    }, [pathname]);

    return null;
}
