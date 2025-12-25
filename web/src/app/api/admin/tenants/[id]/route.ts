import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://127.0.0.1:1337";

/**
 * GET /api/admin/tenants/[id]
 * Get a specific tenant
 */
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const cookieStore = await cookies();
        const token = cookieStore.get("strapi_jwt")?.value;

        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const response = await fetch(
            `${STRAPI_URL}/api/tenants/${id}?populate=users,students`,
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
                { error: error.error?.message || "Tenant not found" },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json({ tenant: data.data });
    } catch (error) {
        console.error("Error fetching tenant:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/admin/tenants/[id]
 * Update a tenant
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const cookieStore = await cookies();
        const token = cookieStore.get("strapi_jwt")?.value;

        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { name, domain, contactEmail, mebbisUsername, mebbisPassword } = body;

        const updateData: Record<string, string | undefined> = {};
        if (name) updateData.name = name;
        if (domain) updateData.domain = domain;
        if (contactEmail !== undefined) updateData.contactEmail = contactEmail;
        if (mebbisUsername !== undefined) updateData.mebbisUsername = mebbisUsername;
        if (mebbisPassword) updateData.mebbisPassword = mebbisPassword;

        const response = await fetch(`${STRAPI_URL}/api/tenants/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ data: updateData }),
        });

        if (!response.ok) {
            const error = await response.json();
            return NextResponse.json(
                { error: error.error?.message || "Failed to update tenant" },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json({ tenant: data.data });
    } catch (error) {
        console.error("Error updating tenant:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/admin/tenants/[id]
 * Delete a tenant
 */
export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const cookieStore = await cookies();
        const token = cookieStore.get("strapi_jwt")?.value;

        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const response = await fetch(`${STRAPI_URL}/api/tenants/${id}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const error = await response.json();
            return NextResponse.json(
                { error: error.error?.message || "Failed to delete tenant" },
                { status: response.status }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting tenant:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
