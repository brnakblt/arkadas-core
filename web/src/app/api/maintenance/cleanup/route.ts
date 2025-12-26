import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { runDataCleanup, getExpiringRecords, RETENTION_PERIODS } from "@/lib/dataRetention";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://127.0.0.1:1337";

/**
 * POST /api/maintenance/cleanup
 * KVKK uyumlu veri temizliği çalıştırır
 * Bu endpoint cron job ile çağrılabilir
 */
export async function POST() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("strapi_jwt")?.value;

        // API key ile de çalışabilir (cron için)
        const cronToken = process.env.CRON_SECRET_TOKEN;

        if (!token && !cronToken) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const authToken = token || cronToken || '';

        // Get user tenant if using JWT
        let tenantId: number | undefined;
        if (token) {
            const userResponse = await fetch(`${STRAPI_URL}/api/users/me?populate=tenant`, {
                headers: { Authorization: `Bearer ${token}` },
                cache: "no-store",
            });

            if (userResponse.ok) {
                const user = await userResponse.json();
                tenantId = user.tenant?.id;
            }
        }

        // Run cleanup
        const result = await runDataCleanup(authToken, tenantId);

        // Log the cleanup operation
        await fetch(`${STRAPI_URL}/api/audit-logs`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({
                data: {
                    action: "delete",
                    entityType: "data_cleanup",
                    success: result.success,
                    metadata: {
                        totalDeleted: result.totalDeleted,
                        totalErrors: result.totalErrors,
                        results: result.results,
                    },
                    tenant: tenantId,
                },
            }),
        });

        return NextResponse.json({
            success: result.success,
            message: `${result.totalDeleted} kayıt temizlendi`,
            details: result,
        });
    } catch (error) {
        console.error("Cleanup error:", error);
        return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
    }
}

/**
 * GET /api/maintenance/cleanup
 * Yaklaşan veri temizleme durumunu gösterir
 */
export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("strapi_jwt")?.value;

        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userResponse = await fetch(`${STRAPI_URL}/api/users/me?populate=tenant`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
        });

        if (!userResponse.ok) {
            return NextResponse.json({ error: "Failed to get user" }, { status: 401 });
        }

        const user = await userResponse.json();
        const tenantId = user.tenant?.id;

        // Get expiring records
        const expiringRecords = await getExpiringRecords(token, 7, tenantId);

        return NextResponse.json({
            retentionPolicies: RETENTION_PERIODS,
            expiringWithin7Days: expiringRecords,
            nextCleanupInfo: {
                description: "Temizlik her gece 03:00'te otomatik çalışır",
                manualTrigger: "POST /api/maintenance/cleanup",
            },
        });
    } catch (error) {
        console.error("Cleanup status error:", error);
        return NextResponse.json({ error: "Status check failed" }, { status: 500 });
    }
}
