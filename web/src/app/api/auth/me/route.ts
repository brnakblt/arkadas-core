import { NextRequest, NextResponse } from "next/server";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://127.0.0.1:1337";

export async function GET(req: NextRequest) {
    const jwt = req.cookies.get("jwt")?.value;

    if (!jwt) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const response = await fetch(`${STRAPI_URL}/api/users/me?populate=*`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${jwt}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            // If token is invalid/expired, we should probably clear the cookie?
            // keeping it simple for now.
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await response.json();
        return NextResponse.json(user);
    } catch {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
