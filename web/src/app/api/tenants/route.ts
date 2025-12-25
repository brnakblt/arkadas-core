import { NextResponse } from "next/server";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://127.0.0.1:1337";

/**
 * GET /api/tenants
 * Public endpoint to get list of tenants for login dropdown
 */
export async function GET() {
    try {
        const response = await fetch(`${STRAPI_URL}/api/tenants?fields[0]=name&fields[1]=domain`, {
            headers: {
                "Content-Type": "application/json",
            },
            cache: "no-store",
        });

        if (!response.ok) {
            return NextResponse.json({ tenants: [] });
        }

        const data = await response.json();

        const tenants = data.data?.map((tenant: { id: number; attributes?: { name: string; domain: string }; name?: string; domain?: string }) => ({
            id: tenant.id,
            name: tenant.attributes?.name || tenant.name,
            domain: tenant.attributes?.domain || tenant.domain,
        })) || [];

        return NextResponse.json({ tenants });
    } catch (error) {
        console.error("Error fetching tenants:", error);
        return NextResponse.json({ tenants: [] });
    }
}
