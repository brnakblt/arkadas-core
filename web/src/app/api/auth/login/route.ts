import { NextRequest, NextResponse } from "next/server";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://127.0.0.1:1337";

export async function POST(req: NextRequest) {
    try {
        const { identifier, password } = await req.json();

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
