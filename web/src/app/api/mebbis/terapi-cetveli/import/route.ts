import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://127.0.0.1:1337";
const MEBBIS_SERVICE_URL = process.env.MEBBIS_SERVICE_URL || "http://127.0.0.1:4000";

/**
 * POST /api/mebbis/terapi-cetveli/import
 * MEBBİS'ten aylık terapi cetvelini çeker
 */
export async function POST(request: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("strapi_jwt")?.value;

        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get current user with tenant
        const userResponse = await fetch(`${STRAPI_URL}/api/users/me?populate=tenant`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
        });

        if (!userResponse.ok) {
            return NextResponse.json({ error: "Failed to get user" }, { status: 401 });
        }

        const currentUser = await userResponse.json();
        const tenantId = currentUser.tenant?.id;

        if (!tenantId) {
            return NextResponse.json({ error: "Tenant not found" }, { status: 400 });
        }

        const body = await request.json();
        const { month, year, studentIds } = body;

        if (!month || !year) {
            return NextResponse.json(
                { error: "month and year are required" },
                { status: 400 }
            );
        }

        // Tenant bilgilerini al (MEBBİS credentials)
        const tenantResponse = await fetch(`${STRAPI_URL}/api/tenants/${tenantId}`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
        });

        if (!tenantResponse.ok) {
            return NextResponse.json({ error: "Tenant fetch failed" }, { status: 500 });
        }

        const tenantData = await tenantResponse.json();
        const tenant = tenantData.data;

        if (!tenant.mebbisUsername || !tenant.mebbisPassword) {
            return NextResponse.json(
                { error: "MEBBİS credentials not configured for this tenant" },
                { status: 400 }
            );
        }

        // MEBBİS Service'e istek at
        const mebbisResponse = await fetch(`${MEBBIS_SERVICE_URL}/api/terapi-cetveli`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                tenantId,
                month,
                year,
                studentIds: studentIds || [], // Boşsa tüm öğrenciler
                credentials: {
                    username: tenant.mebbisUsername,
                    password: tenant.mebbisPassword, // Şifreli olarak saklanmalı
                },
            }),
        });

        if (!mebbisResponse.ok) {
            const errorData = await mebbisResponse.json().catch(() => ({}));
            return NextResponse.json(
                { error: errorData.message || "MEBBİS import failed" },
                { status: mebbisResponse.status }
            );
        }

        const importResult = await mebbisResponse.json();

        // Strapi'ye kaydet
        const savedCetveller: number[] = [];

        for (const cetvel of importResult.cetveller || []) {
            const saveResponse = await fetch(`${STRAPI_URL}/api/terapi-cetvelleri`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    data: {
                        student: cetvel.studentId,
                        month: String(month).padStart(2, '0'),
                        year,
                        sessions: cetvel.sessions,
                        totalBireysel: cetvel.totalBireysel,
                        totalGrup: cetvel.totalGrup,
                        totalHours: cetvel.totalHours,
                        importedFromMebbis: true,
                        mebbisImportDate: new Date().toISOString(),
                        status: 'onaylandi',
                        tenant: tenantId,
                    },
                }),
            });

            if (saveResponse.ok) {
                const saved = await saveResponse.json();
                savedCetveller.push(saved.data.id);
            }
        }

        return NextResponse.json({
            success: true,
            message: `${savedCetveller.length} terapi cetveli MEBBİS'ten alındı`,
            imported: savedCetveller.length,
            cetvelIds: savedCetveller,
            month: `${year}-${String(month).padStart(2, '0')}`,
        });
    } catch (error) {
        console.error("Error importing terapi cetveli:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * GET /api/mebbis/terapi-cetveli/import
 * Terapi cetveli import durumu
 */
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    return NextResponse.json({
        description: 'MEBBİS Terapi Cetveli (Ek-4) Import API',
        usage: {
            method: 'POST',
            body: {
                month: 'number (1-12)',
                year: 'number (2024)',
                studentIds: 'number[] (optional, empty = all students)',
            },
        },
        currentRequest: { month, year },
    });
}
