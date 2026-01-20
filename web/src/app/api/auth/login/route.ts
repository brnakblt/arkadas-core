import { NextRequest, NextResponse } from "next/server";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://127.0.0.1:1337";

export async function POST(req: NextRequest) {
    try {
        const { identifier, password } = await req.json();

        // Rate Limiting (5 attempts per 60s)
        // We need to dynamically import to avoid build issues if redis is not present during static analysis
        const { rateLimit } = await import('@/lib/rate-limit');
        const ip = req.headers.get("x-forwarded-for") || "unknown";
        const { success } = await rateLimit(ip, 5, 60);

        if (!success) {
            return NextResponse.json(
                { error: "Çok fazla başarısız giriş denemesi. Lütfen 1 dakika sonra tekrar deneyiniz." },
                { status: 429 }
            );
        }

        const response = await fetch(`${STRAPI_URL}/api/auth/local`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                identifier,
                password,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(
                { error: data.error?.message || "Giriş yapılamadı" },
                { status: response.status }
            );
        }

        const { jwt, user } = data;

        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict" as const,
            path: "/",
            // Set to 7 days or whatever Strapi's default is
            maxAge: 7 * 24 * 60 * 60,
        };

        const nextResponse = NextResponse.json({ user });

        // Set the JWT as a cookie
        nextResponse.cookies.set("jwt", jwt, cookieOptions);

        return nextResponse;
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Bir hata oluştu";
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}
