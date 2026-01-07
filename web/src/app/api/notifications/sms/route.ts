import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://127.0.0.1:1337";

type SmsTemplateType = 'attendance_alert' | 'schedule_reminder' | 'emergency' | 'payment_reminder' | 'parent_notification';

interface SmsSendPayload {
    templateType?: SmsTemplateType;
    message?: string; // Custom message (used if no templateType)
    userIds?: number[]; // Specific users, if empty sends to all tenant users (parents)
    data?: Record<string, unknown>; // Template data
}

/**
 * POST /api/notifications/sms
 * Send SMS to tenant users (tenant-isolated)
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

        const body: SmsSendPayload = await request.json();
        const { templateType, message, userIds, data } = body;

        if (!templateType && !message) {
            return NextResponse.json(
                { error: "templateType or message is required" },
                { status: 400 }
            );
        }

        // Get target users (only parents from current tenant with phone numbers)
        let targetUsers: Array<{ id: number; phone?: string; username: string }> = [];

        const userFilter = userIds && userIds.length > 0
            ? `&filters[id][$in]=${userIds.join(',')}`
            : '';

        const usersResponse = await fetch(
            `${STRAPI_URL}/api/users?filters[tenant][id][$eq]=${tenantId}&filters[userType][$eq]=parent${userFilter}`,
            {
                headers: { Authorization: `Bearer ${token}` },
                cache: "no-store",
            }
        );

        if (usersResponse.ok) {
            const allUsers = await usersResponse.json();
            // Filter only users with phone numbers
            targetUsers = allUsers.filter((u: { phone?: string }) => u.phone);
        }

        if (targetUsers.length === 0) {
            return NextResponse.json({
                success: false,
                message: "No users with phone numbers found",
                sent: 0,
            });
        }

        // Generate SMS text
        const smsText = templateType
            ? generateTemplateText(templateType, data || {})
            : message || '';

        // Log SMS sending (in production, use actual SMS service)
        const smsResults = targetUsers.map((user) => {
            // In production: smsService.send({ to: user.phone, text: smsText })
            console.warn(`[SMS] To: ${user.phone}, Text: ${smsText.substring(0, 50)}...`);
            return { userId: user.id, phone: user.phone, success: true };
        });

        const successCount = smsResults.filter(r => r.success).length;

        // Store SMS log in database
        try {
            await fetch(`${STRAPI_URL}/api/sms-logs`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    data: {
                        tenant: tenantId,
                        templateType: templateType || 'custom',
                        messagePreview: smsText.substring(0, 160),
                        recipientCount: successCount,
                        sentBy: currentUser.id,
                        sentAt: new Date().toISOString(),
                    },
                }),
            });
        } catch {
            // Log creation failed, continue anyway
        }

        return NextResponse.json({
            success: true,
            message: `SMS sent to ${successCount} recipients`,
            sent: successCount,
            failed: smsResults.length - successCount,
            tenantName: currentUser.tenant?.name,
        });
    } catch (error) {
        console.error("Error sending SMS:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * GET /api/notifications/sms
 * Get SMS template types info
 */
export async function GET() {
    const templates: Record<SmsTemplateType, { name: string; description: string; example: string }> = {
        attendance_alert: {
            name: 'Yoklama Bildirimi',
            description: 'Öğrenci geldi/gelmedi bildirimi',
            example: 'Arkadaş: Ali bugün kuruma geldi. Saat: 08:30',
        },
        schedule_reminder: {
            name: 'Program Hatırlatması',
            description: 'Etkinlik/ders hatırlatması',
            example: 'Arkadaş Hatırlatma: Veli toplantısı - 15 Ocak 14:00',
        },
        emergency: {
            name: 'Acil Durum',
            description: 'Acil bilgilendirme',
            example: '⚠️ ACİL - Arkadaş: Önemli Duyuru...',
        },
        payment_reminder: {
            name: 'Ödeme Hatırlatması',
            description: 'Fatura/ödeme hatırlatması',
            example: 'Arkadaş: Ocak dönemi ödemeniz için son tarih 15.01.2024',
        },
        parent_notification: {
            name: 'Veli Bildirimi',
            description: 'Genel veli bilgilendirmesi',
            example: 'Arkadaş - Ali: Bugünkü BEP çalışması tamamlandı.',
        },
    };

    return NextResponse.json({ templates });
}

function generateTemplateText(type: SmsTemplateType, data: Record<string, unknown>): string {
    const templates: Record<SmsTemplateType, (data: Record<string, unknown>) => string> = {
        attendance_alert: (d) => {
            const status = d.status === 'present' ? 'geldi' : d.status === 'absent' ? 'gelmedi' : 'geç kaldı';
            return `Arkadaş: ${d.studentName || 'Öğrenciniz'} bugün kuruma ${status}. Saat: ${d.time || '-'}`;
        },
        schedule_reminder: (d) =>
            `Arkadaş Hatırlatma: ${d.eventTitle || 'Etkinlik'} - ${d.date || 'bugün'} ${d.time || ''}`,
        emergency: (d) =>
            `⚠️ ACİL - Arkadaş: ${d.title || 'Önemli Duyuru'}. ${d.message || ''}`,
        payment_reminder: (d) =>
            `Arkadaş: ${d.period || ''} dönemi ödemeniz için son tarih ${d.dueDate || '-'}. Tutar: ${d.amount || '-'} TL`,
        parent_notification: (d) =>
            `Arkadaş - ${d.studentName || 'Öğrenciniz'}: ${d.message || 'Bilgilendirme'}`.substring(0, 160),
    };

    return templates[type](data);
}
