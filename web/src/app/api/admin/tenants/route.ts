import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://127.0.0.1:1337";

/**
 * GET /api/admin/tenants
 * List all tenants (admin only)
 */
export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("strapi_jwt")?.value;

        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const response = await fetch(
            `${STRAPI_URL}/api/tenants?populate=users,students`,
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
                { error: error.error?.message || "Failed to fetch tenants" },
                { status: response.status }
            );
        }

        const data = await response.json();

        const tenants = data.data?.map((tenant: {
            id: number;
            documentId?: string;
            name?: string;
            domain?: string;
            contactEmail?: string;
            users?: { count?: number } | unknown[];
            students?: { count?: number } | unknown[];
            createdAt?: string;
            attributes?: {
                name?: string;
                domain?: string;
                contactEmail?: string;
                users?: { data?: unknown[] };
                students?: { data?: unknown[] };
                createdAt?: string;
            };
        }) => ({
            id: tenant.id,
            documentId: tenant.documentId,
            name: tenant.name || tenant.attributes?.name,
            domain: tenant.domain || tenant.attributes?.domain,
            contactEmail: tenant.contactEmail || tenant.attributes?.contactEmail,
            usersCount: Array.isArray(tenant.users) ? tenant.users.length : (tenant.attributes?.users?.data?.length || 0),
            studentsCount: Array.isArray(tenant.students) ? tenant.students.length : (tenant.attributes?.students?.data?.length || 0),
            createdAt: tenant.createdAt || tenant.attributes?.createdAt,
        })) || [];

        return NextResponse.json({ tenants });
    } catch (error) {
        console.error("Error fetching tenants:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/admin/tenants
 * Create a new tenant (admin only)
 */
export async function POST(request: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("strapi_jwt")?.value;

        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { name, domain, contactEmail, mebbisUsername, mebbisPassword } = body;

        if (!name || !domain) {
            return NextResponse.json(
                { error: "Name and domain are required" },
                { status: 400 }
            );
        }

        const response = await fetch(`${STRAPI_URL}/api/tenants`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                data: {
                    name,
                    domain,
                    contactEmail,
                    mebbisUsername,
                    mebbisPassword,
                },
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            return NextResponse.json(
                { error: error.error?.message || "Failed to create tenant" },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json({ tenant: data.data }, { status: 201 });
    } catch (error) {
        console.error("Error creating tenant:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
