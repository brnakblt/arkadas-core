import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://127.0.0.1:1337";

/**
 * GET /api/admin/users/unassigned
 * Get users without a tenant assigned
 */
export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("strapi_jwt")?.value;

        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get users where tenant is null
        const response = await fetch(
            `${STRAPI_URL}/api/users?filters[tenant][$null]=true`,
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                cache: "no-store",
            }
        );

        if (!response.ok) {
            const error = await response.json();
            return NextResponse.json(
                { error: error.error?.message || "Failed to fetch users" },
                { status: response.status }
            );
        }

        const users = await response.json();
        return NextResponse.json({ users });
    } catch (error) {
        console.error("Error fetching unassigned users:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
