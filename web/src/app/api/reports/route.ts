import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://127.0.0.1:1337";

interface ReportSummary {
    id: number;
    documentId: string;
    title: string;
    type: 'bep' | 'yoklama' | 'fatura' | 'ilerleme';
    studentName?: string;
    createdAt: string;
    status: string;
}

/**
 * GET /api/reports
 * Get reports list with tenant filtering and optional type filter
 */
export async function GET(request: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("strapi_jwt")?.value;

        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const type = searchParams.get("type"); // bep, yoklama, fatura, ilerleme
        const studentId = searchParams.get("studentId");
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");
        const page = parseInt(searchParams.get("page") || "1");
        const pageSize = parseInt(searchParams.get("pageSize") || "20");

        // Get user's tenant
        const userResponse = await fetch(`${STRAPI_URL}/api/users/me?populate=tenant`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
        });

        if (!userResponse.ok) {
            return NextResponse.json({ error: "Failed to get user" }, { status: 401 });
        }

        const user = await userResponse.json();
        const tenantId = user.tenant?.id;

        // Build filters
        const filters: string[] = [];
        if (tenantId) {
            filters.push(`filters[tenant][id][$eq]=${tenantId}`);
        }
        if (studentId) {
            filters.push(`filters[student][id][$eq]=${studentId}`);
        }
        if (startDate) {
            filters.push(`filters[createdAt][$gte]=${startDate}`);
        }
        if (endDate) {
            filters.push(`filters[createdAt][$lte]=${endDate}`);
        }

        const pagination = `pagination[page]=${page}&pagination[pageSize]=${pageSize}`;
        const populate = "populate=student";
        const sort = "sort=createdAt:desc";

        // Determine which endpoint to query based on type
        let endpoint = "";
        switch (type) {
            case "bep":
                endpoint = "bireysel-egitim-planis";
                break;
            case "yoklama":
                endpoint = "attendance-logs";
                break;
            case "fatura":
                endpoint = "faturas";
                break;
            case "ilerleme":
                endpoint = "performans-kayits";
                break;
            default:
                // Get rapors table for general reports
                endpoint = "rapors";
        }

        const queryString = [filters.join("&"), pagination, populate, sort].filter(Boolean).join("&");
        const response = await fetch(
            `${STRAPI_URL}/api/${endpoint}?${queryString}`,
            {
                headers: { Authorization: `Bearer ${token}` },
                cache: "no-store",
            }
        );

        if (!response.ok) {
            return NextResponse.json(
                { error: "Failed to fetch reports" },
                { status: response.status }
            );
        }

        const data = await response.json();

        // Transform to unified report format
        const reports: ReportSummary[] = (data.data || []).map((item: Record<string, unknown>) => ({
            id: item.id,
            documentId: item.documentId,
            title: (item as { title?: string; name?: string }).title || (item as { title?: string; name?: string }).name || `Rapor #${item.id}`,
            type: type || "rapor",
            studentName: ((item as { student?: { firstName?: string; lastName?: string } }).student?.firstName || "") + " " +
                ((item as { student?: { firstName?: string; lastName?: string } }).student?.lastName || ""),
            createdAt: item.createdAt as string,
            status: (item as { status?: string }).status || "published",
        }));

        return NextResponse.json({
            reports,
            pagination: data.meta?.pagination || { page, pageSize, total: 0 },
            tenantName: user.tenant?.name,
        });
    } catch (error) {
        console.error("Error fetching reports:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
