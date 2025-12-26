import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { generateReport } from "@/lib/reportGenerator";
import { MEB_REPORT_TYPES, ReportRequest, ReportFormat, getReportById } from "@/lib/mebReports";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://127.0.0.1:1337";

/**
 * GET /api/reports/generate
 * Mevcut rapor türlerini listeler
 */
export async function GET() {
    const reports = Object.values(MEB_REPORT_TYPES).map(report => ({
        id: report.id,
        name: report.name,
        description: report.description,
        category: report.category,
        formats: report.formats,
        official: 'official' in report ? report.official : false,
    }));

    const categories = [
        { id: 'personel', name: 'Personel Raporları' },
        { id: 'bep', name: 'BEP Raporları' },
        { id: 'finans', name: 'Finans Raporları' },
        { id: 'egitimci', name: 'Eğitimci Raporları' },
        { id: 'ogrenci', name: 'Öğrenci Raporları' },
        { id: 'diger', name: 'Diğer' },
    ];

    return NextResponse.json({
        reports,
        categories,
        totalReports: reports.length,
        officialReports: reports.filter(r => r.official).length,
    });
}

/**
 * POST /api/reports/generate
 * Rapor oluşturur ve indirir
 */
export async function POST(request: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("strapi_jwt")?.value;

        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get user tenant
        const userResponse = await fetch(`${STRAPI_URL}/api/users/me?populate=tenant`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
        });

        if (!userResponse.ok) {
            return NextResponse.json({ error: "Failed to get user" }, { status: 401 });
        }

        const user = await userResponse.json();
        const tenantId = user.tenant?.id;

        if (!tenantId) {
            return NextResponse.json({ error: "Tenant bulunamadı" }, { status: 400 });
        }

        // Parse request body
        const body = await request.json();
        const { reportId, format, month, year, studentId, teacherId, groupId } = body;

        // Validate report type
        const reportDef = getReportById(reportId);
        if (!reportDef) {
            return NextResponse.json(
                { error: `Geçersiz rapor türü: ${reportId}` },
                { status: 400 }
            );
        }

        // Validate format
        if (!['pdf', 'excel'].includes(format)) {
            return NextResponse.json(
                { error: 'Format pdf veya excel olmalıdır' },
                { status: 400 }
            );
        }

        // Check if format is supported for this report
        if (!reportDef.formats.includes(format as ReportFormat)) {
            return NextResponse.json(
                { error: `${reportDef.name} için ${format} formatı desteklenmiyor` },
                { status: 400 }
            );
        }

        // Build request
        const reportRequest: ReportRequest = {
            reportId,
            format: format as ReportFormat,
            filters: {
                tenantId,
                month: month || new Date().getMonth() + 1,
                year: year || new Date().getFullYear(),
                studentId,
                teacherId,
                groupId,
            },
        };

        // Generate report
        const result = await generateReport(reportRequest, token);

        if (!result.success || !result.data) {
            return NextResponse.json(
                { error: result.error || 'Rapor oluşturulamadı' },
                { status: 500 }
            );
        }

        // Return file
        return new NextResponse(result.data, {
            headers: {
                'Content-Type': result.contentType,
                'Content-Disposition': `attachment; filename="${result.fileName}"`,
            },
        });
    } catch (error) {
        console.error("Report generation error:", error);
        return NextResponse.json(
            { error: "Rapor oluşturma hatası" },
            { status: 500 }
        );
    }
}
