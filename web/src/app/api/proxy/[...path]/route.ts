import { NextRequest, NextResponse } from "next/server";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://127.0.0.1:1337";

async function proxyRequest(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    const { path: pathArray } = await params;
    const path = pathArray.join("/");
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
