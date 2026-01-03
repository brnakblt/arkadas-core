/**
 * API Proxy Route
 * MEDIUM FIX: Restricted to allowed API paths only
 */

import { NextRequest, NextResponse } from "next/server";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://127.0.0.1:1337";

// SECURITY FIX: Whitelist of allowed API path prefixes
const ALLOWED_PATH_PREFIXES = [
    'api/',  // Standard Strapi API endpoints
];

// Explicitly blocked paths (even within allowed prefixes)
const BLOCKED_PATHS = [
    'admin',
    '_health',
    'users/me', // Use dedicated auth endpoint instead
    'upload',   // Use dedicated upload endpoint
];

function isPathAllowed(path: string): boolean {
    const normalizedPath = path.toLowerCase();

    // Check if path starts with an allowed prefix
    const hasAllowedPrefix = ALLOWED_PATH_PREFIXES.some(prefix =>
        normalizedPath.startsWith(prefix)
    );

    if (!hasAllowedPrefix) {
        return false;
    }

    // Check if path contains any blocked segments
    const isBlocked = BLOCKED_PATHS.some(blocked =>
        normalizedPath.includes(blocked)
    );

    return !isBlocked;
}

async function proxyRequest(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    const { path: pathArray } = await params;
    const path = pathArray.join("/");

    // SECURITY CHECK: Validate path is allowed
    if (!isPathAllowed(path)) {
        console.warn(`Blocked proxy request to: ${path}`);
        return NextResponse.json(
            { error: "Access denied: Path not allowed" },
            { status: 403 }
        );
    }

    const jwt = req.cookies.get("jwt")?.value;

    const headers: HeadersInit = {
        "Content-Type": "application/json",
    };

    if (jwt) {
        (headers as Record<string, string>)["Authorization"] = `Bearer ${jwt}`;
    }

    const body = req.method !== "GET" && req.method !== "HEAD" ? await req.text() : undefined;

    try {
        const response = await fetch(`${STRAPI_URL}/${path}${req.nextUrl.search}`, {
            method: req.method,
            headers,
            body,
        });

        const data = await response.json();

        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error("Proxy error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export { proxyRequest as GET, proxyRequest as POST, proxyRequest as PUT, proxyRequest as DELETE, proxyRequest as PATCH };
