import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://127.0.0.1:1337";

/**
 * GET /api/reports/[id]/pdf
 * Generate PDF for a specific report (BEP, Yoklama, etc.)
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: reportId } = await params;
        const cookieStore = await cookies();
        const token = cookieStore.get("strapi_jwt")?.value;

        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const type = searchParams.get("type") || "bep";

        // Get user's tenant for validation
        const userResponse = await fetch(`${STRAPI_URL}/api/users/me?populate=tenant`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
        });

        if (!userResponse.ok) {
            return NextResponse.json({ error: "Failed to get user" }, { status: 401 });
        }

        const user = await userResponse.json();
        const tenantId = user.tenant?.id;

        // Determine endpoint based on type
        let endpoint = "";
        let populate = "";
        switch (type) {
            case "bep":
                endpoint = "bireysel-egitim-planis";
                populate = "populate=student,modules,teacher";
                break;
            case "yoklama":
                endpoint = "attendance-logs";
                populate = "populate=student,user";
                break;
            case "fatura":
                endpoint = "faturas";
                populate = "populate=student,items";
                break;
            default:
                endpoint = "rapors";
                populate = "populate=student";
        }

        // Fetch report data
        const response = await fetch(
            `${STRAPI_URL}/api/${endpoint}/${reportId}?${populate}`,
            {
                headers: { Authorization: `Bearer ${token}` },
                cache: "no-store",
            }
        );

        if (!response.ok) {
            return NextResponse.json(
                { error: "Report not found" },
                { status: 404 }
            );
        }

        const data = await response.json();
        const report = data.data;

        // Verify tenant access
        if (tenantId && report.tenant?.id !== tenantId) {
            return NextResponse.json(
                { error: "Access denied" },
                { status: 403 }
            );
        }

        // Generate PDF content (HTML template)
        const pdfHtml = generatePdfHtml(report, type, user.tenant?.name || 'Arkadaş ERP');

        // Return HTML for now - can be converted to PDF with external service
        return new NextResponse(pdfHtml, {
            headers: {
                "Content-Type": "text/html; charset=utf-8",
                "Content-Disposition": `inline; filename="${type}-${reportId}.html"`,
            },
        });
    } catch (error) {
        console.error("Error generating PDF:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// Generate PDF-ready HTML template
function generatePdfHtml(
    report: Record<string, unknown>,
    type: string,
    tenantName: string
): string {
    const now = new Date().toLocaleDateString('tr-TR');
    const student = report.student as { firstName?: string; lastName?: string } | undefined;
    const studentName = student ? `${student.firstName || ''} ${student.lastName || ''}` : 'Bilinmiyor';

    let title = '';
    let content = '';

    switch (type) {
        case 'bep':
            title = 'Bireysel Eğitim Planı';
            content = generateBepContent(report);
            break;
        case 'yoklama':
            title = 'Yoklama Raporu';
            content = generateYoklamaContent(report);
            break;
        case 'fatura':
            title = 'Fatura';
            content = generateFaturaContent(report);
            break;
        default:
            title = 'Rapor';
            content = `<p>Rapor içeriği</p>`;
    }

    return `
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <title>${title} - ${studentName}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, sans-serif;
            line-height: 1.6;
            color: #333;
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 3px solid #3b82f6;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .logo { font-size: 24px; font-weight: bold; color: #3b82f6; }
        .date { color: #666; font-size: 14px; }
        h1 { font-size: 28px; margin-bottom: 10px; color: #1f2937; }
        h2 { font-size: 20px; margin: 20px 0 10px; color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
        .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0; }
        .info-item { background: #f3f4f6; padding: 15px; border-radius: 8px; }
        .info-label { font-size: 12px; color: #6b7280; text-transform: uppercase; }
        .info-value { font-size: 16px; font-weight: 600; margin-top: 5px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
        th { background: #f9fafb; font-weight: 600; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 12px; }
        @media print {
            body { padding: 20px; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">📚 ${tenantName}</div>
        <div class="date">${now}</div>
    </div>
    
    <h1>${title}</h1>
    
    <div class="info-grid">
        <div class="info-item">
            <div class="info-label">Öğrenci</div>
            <div class="info-value">${studentName}</div>
        </div>
        <div class="info-item">
            <div class="info-label">Rapor No</div>
            <div class="info-value">#${report.id}</div>
        </div>
    </div>

    ${content}

    <div class="footer">
        <p>Bu rapor ${tenantName} tarafından oluşturulmuştur.</p>
        <p class="no-print">
            <button onclick="window.print()" style="margin-top: 10px; padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 5px; cursor: pointer;">
                🖨️ Yazdır / PDF Kaydet
            </button>
        </p>
    </div>
</body>
</html>`;
}

function generateBepContent(report: Record<string, unknown>): string {
    const modules = (report.modules || []) as Array<{ name?: string; status?: string; goal?: string }>;
    return `
        <h2>Program Bilgileri</h2>
        <div class="info-grid">
            <div class="info-item">
                <div class="info-label">Başlangıç</div>
                <div class="info-value">${report.startDate || '-'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Bitiş</div>
                <div class="info-value">${report.endDate || '-'}</div>
            </div>
        </div>

        <h2>Modüller</h2>
        <table>
            <thead>
                <tr>
                    <th>Modül</th>
                    <th>Hedef</th>
                    <th>Durum</th>
                </tr>
            </thead>
            <tbody>
                ${modules.map(m => `
                    <tr>
                        <td>${m.name || '-'}</td>
                        <td>${m.goal || '-'}</td>
                        <td>${m.status || '-'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function generateYoklamaContent(report: Record<string, unknown>): string {
    return `
        <h2>Yoklama Detayları</h2>
        <div class="info-grid">
            <div class="info-item">
                <div class="info-label">Tarih/Saat</div>
                <div class="info-value">${new Date(report.createdAt as string).toLocaleString('tr-TR')}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Durum</div>
                <div class="info-value">${report.eventType === 'check_in' ? '✅ Giriş' : '🚪 Çıkış'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Yöntem</div>
                <div class="info-value">${report.method || 'Manuel'}</div>
            </div>
        </div>
    `;
}

function generateFaturaContent(report: Record<string, unknown>): string {
    const items = (report.items || []) as Array<{ description?: string; amount?: number }>;
    const total = items.reduce((sum, item) => sum + (item.amount || 0), 0);
    return `
        <h2>Fatura Detayları</h2>
        <table>
            <thead>
                <tr>
                    <th>Açıklama</th>
                    <th style="text-align: right;">Tutar</th>
                </tr>
            </thead>
            <tbody>
                ${items.map(item => `
                    <tr>
                        <td>${item.description || '-'}</td>
                        <td style="text-align: right;">${(item.amount || 0).toLocaleString('tr-TR')} ₺</td>
                    </tr>
                `).join('')}
                <tr style="font-weight: bold; background: #f0f9ff;">
                    <td>TOPLAM</td>
                    <td style="text-align: right;">${total.toLocaleString('tr-TR')} ₺</td>
                </tr>
            </tbody>
        </table>
    `;
}
