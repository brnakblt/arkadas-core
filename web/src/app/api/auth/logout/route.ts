import { NextRequest, NextResponse } from "next/server";

export async function POST(_req: NextRequest) {
    const response = NextResponse.json({ message: "Çıkış başarılı" });

    // Clear the cookie by setting it to expire immediately
    response.cookies.set("jwt", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 0,
    });

    return response;
}
