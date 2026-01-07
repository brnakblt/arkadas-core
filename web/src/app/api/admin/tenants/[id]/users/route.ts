import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://127.0.0.1:1337";

/**
 * GET /api/admin/tenants/[id]/users
 * Get users of a specific tenant
 */
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: tenantId } = await params;
        const cookieStore = await cookies();
        const token = cookieStore.get("strapi_jwt")?.value;

        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get users filtered by tenant
        const response = await fetch(
            `${STRAPI_URL}/api/users?filters[tenant][documentId][$eq]=${tenantId}&populate=tenant`,
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
        console.error("Error fetching tenant users:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/admin/tenants/[id]/users
 * Assign a user to a tenant
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: tenantId } = await params;
        const cookieStore = await cookies();
        const token = cookieStore.get("strapi_jwt")?.value;

        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { userId } = body;

        if (!userId) {
            return NextResponse.json(
                { error: "userId is required" },
                { status: 400 }
            );
        }

        // First, get tenant's numeric ID from documentId
        const tenantResponse = await fetch(
            `${STRAPI_URL}/api/tenants/${tenantId}`,
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        if (!tenantResponse.ok) {
            return NextResponse.json(
                { error: "Tenant not found" },
                { status: 404 }
            );
        }

        const tenantData = await tenantResponse.json();
        const tenantNumericId = tenantData.data?.id;

        // Update user's tenant
        const updateResponse = await fetch(
            `${STRAPI_URL}/api/users/${userId}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    tenant: tenantNumericId,
                }),
            }
        );

        if (!updateResponse.ok) {
            const error = await updateResponse.json();
            return NextResponse.json(
                { error: error.error?.message || "Failed to assign user" },
                { status: updateResponse.status }
            );
        }

        const updatedUser = await updateResponse.json();
        return NextResponse.json({ user: updatedUser });
    } catch (error) {
        console.error("Error assigning user to tenant:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/admin/tenants/[id]/users
 * Remove a user from a tenant
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const _tenantId = (await params).id;
        const cookieStore = await cookies();
        const token = cookieStore.get("strapi_jwt")?.value;

        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId");

        if (!userId) {
            return NextResponse.json(
                { error: "userId is required" },
                { status: 400 }
            );
        }

        // Remove tenant from user (set to null)
        const updateResponse = await fetch(
            `${STRAPI_URL}/api/users/${userId}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    tenant: null,
                }),
            }
        );

        if (!updateResponse.ok) {
            const error = await updateResponse.json();
            return NextResponse.json(
                { error: error.error?.message || "Failed to remove user" },
                { status: updateResponse.status }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error removing user from tenant:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
