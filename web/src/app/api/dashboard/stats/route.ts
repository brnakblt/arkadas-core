import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://127.0.0.1:1337";

interface TenantStats {
    studentsCount: number;
    usersCount: number;
    appointmentsThisWeek: number;
    invoicesThisMonth: number;
    reportsCount: number;
    pendingBep: number;
}

/**
 * GET /api/dashboard/stats
 * Get dashboard statistics for the current user's tenant
 */
export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("strapi_jwt")?.value;

        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get current user with tenant
        const userResponse = await fetch(`${STRAPI_URL}/api/users/me?populate=tenant`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
        });

        if (!userResponse.ok) {
            return NextResponse.json({ error: "Failed to get user" }, { status: 401 });
        }

        const user = await userResponse.json();
        const tenantId = user.tenant?.id;

        // Build stats - if no tenant, return zeros
        if (!tenantId) {
            return NextResponse.json({
                stats: {
                    studentsCount: 0,
                    usersCount: 0,
                    appointmentsThisWeek: 0,
                    invoicesThisMonth: 0,
                    reportsCount: 0,
                    pendingBep: 0,
                } as TenantStats,
            });
        }

        const tenantFilter = `filters[tenant][id][$eq]=${tenantId}`;

        // Fetch all stats in parallel
        const [students, appointments, invoices, reports, beps] = await Promise.all([
            // Students count
            fetch(`${STRAPI_URL}/api/student-profiles?${tenantFilter}&pagination[pageSize]=1`, {
                headers: { Authorization: `Bearer ${token}` },
                cache: "no-store",
            }).then(r => r.json()),

            // Appointments this week
            fetch(`${STRAPI_URL}/api/appointments?${tenantFilter}&filters[date][$gte]=${getStartOfWeek()}&filters[date][$lte]=${getEndOfWeek()}&pagination[pageSize]=1`, {
                headers: { Authorization: `Bearer ${token}` },
                cache: "no-store",
            }).then(r => r.json()).catch(() => ({ meta: { pagination: { total: 0 } } })),

            // Invoices this month
            fetch(`${STRAPI_URL}/api/faturas?${tenantFilter}&filters[createdAt][$gte]=${getStartOfMonth()}&pagination[pageSize]=1`, {
                headers: { Authorization: `Bearer ${token}` },
                cache: "no-store",
            }).then(r => r.json()).catch(() => ({ meta: { pagination: { total: 0 } } })),

            // Reports count
            fetch(`${STRAPI_URL}/api/rapors?${tenantFilter}&pagination[pageSize]=1`, {
                headers: { Authorization: `Bearer ${token}` },
                cache: "no-store",
            }).then(r => r.json()).catch(() => ({ meta: { pagination: { total: 0 } } })),

            // Pending BEP (status = pending)
            fetch(`${STRAPI_URL}/api/bireysel-egitim-planis?${tenantFilter}&filters[status][$eq]=draft&pagination[pageSize]=1`, {
                headers: { Authorization: `Bearer ${token}` },
                cache: "no-store",
            }).then(r => r.json()).catch(() => ({ meta: { pagination: { total: 0 } } })),
        ]);

        // Get users count for tenant
        const usersResponse = await fetch(
            `${STRAPI_URL}/api/users?filters[tenant][id][$eq]=${tenantId}`,
            {
                headers: { Authorization: `Bearer ${token}` },
                cache: "no-store",
            }
        );
        const users = await usersResponse.json();

        const stats: TenantStats = {
            studentsCount: students.meta?.pagination?.total || 0,
            usersCount: Array.isArray(users) ? users.length : 0,
            appointmentsThisWeek: appointments.meta?.pagination?.total || 0,
            invoicesThisMonth: invoices.meta?.pagination?.total || 0,
            reportsCount: reports.meta?.pagination?.total || 0,
            pendingBep: beps.meta?.pagination?.total || 0,
        };


        return NextResponse.json(
            { stats, tenantName: user.tenant?.name },
            {
                headers: {
                    "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
                },
            }
        );
    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// Helper functions for date ranges
function getStartOfWeek(): string {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const start = new Date(now.setDate(diff));
    return start.toISOString().split("T")[0];
}

function getEndOfWeek(): string {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? 0 : 7);
    const end = new Date(now.setDate(diff));
    return end.toISOString().split("T")[0];
}

function getStartOfMonth(): string {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
}
