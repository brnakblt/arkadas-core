import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://127.0.0.1:1337";

type NotificationType = 'attendance' | 'schedule' | 'message' | 'invoice' | 'alert' | 'reminder' | 'report';

interface NotificationPayload {
    type: NotificationType;
    title?: string;
    message: string;
    data?: Record<string, unknown>;
    userIds?: number[]; // Specific users, if empty sends to all tenant users
}

/**
 * POST /api/notifications/send
 * Send notifications to tenant users (tenant-isolated)
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

        const body: NotificationPayload = await request.json();
        const { type, title, message, data, userIds } = body;

        if (!type || !message) {
            return NextResponse.json(
                { error: "type and message are required" },
                { status: 400 }
            );
        }

        // Get target users (only from current tenant)
        let targetUsers: Array<{ id: number; email: string; username: string }> = [];

        if (userIds && userIds.length > 0) {
            // Fetch specific users, but verify they belong to the tenant
            const usersResponse = await fetch(
                `${STRAPI_URL}/api/users?filters[tenant][id][$eq]=${tenantId}&filters[id][$in]=${userIds.join(',')}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    cache: "no-store",
                }
            );

            if (usersResponse.ok) {
                targetUsers = await usersResponse.json();
            }
        } else {
            // Get all tenant users
            const usersResponse = await fetch(
                `${STRAPI_URL}/api/users?filters[tenant][id][$eq]=${tenantId}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    cache: "no-store",
                }
            );

            if (usersResponse.ok) {
                targetUsers = await usersResponse.json();
            }
        }

        if (targetUsers.length === 0) {
            return NextResponse.json({
                success: false,
                message: "No users found to notify",
                sent: 0,
            });
        }


        // Queue optimization: If sending to many users (>5), offload to queue
        if (targetUsers.length > 5) {
            // We need to dynamically import to avoid build issues if redis is not present during static analysis
            const { addNotificationJob } = await import('@/lib/queue');

            await addNotificationJob({
                type,
                title: title || getDefaultTitle(type),
                message,
                data,
                userIds: targetUsers.map(u => u.id),
                tenantId,
                userCount: targetUsers.length
            });

            return NextResponse.json({
                success: true,
                message: `Bulk notification queued for ${targetUsers.length} users`,
                queued: true,
                tenantName: currentUser.tenant?.name,
            });
        }

        // Create notification records in Strapi (if notifications content type exists)
        const notificationPromises = targetUsers.map(async (user) => {
            try {
                // Store notification in database
                await fetch(`${STRAPI_URL}/api/notifications`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        data: {
                            type,
                            title: title || getDefaultTitle(type),
                            message,
                            data: JSON.stringify(data || {}),
                            user: user.id,
                            tenant: tenantId,
                            read: false,
                            sentAt: new Date().toISOString(),
                        },
                    }),
                });

                return { userId: user.id, success: true };
            } catch {
                return { userId: user.id, success: false };
            }
        });

        const results = await Promise.all(notificationPromises);
        const successCount = results.filter(r => r.success).length;

        return NextResponse.json({
            success: true,
            message: `Notification sent to ${successCount} users`,
            sent: successCount,
            failed: results.length - successCount,
            tenantName: currentUser.tenant?.name,
        });
    } catch (error) {
        console.error("Error sending notifications:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * GET /api/notifications/send
 * Get notification types and templates info
 */
export async function GET() {
    const types: Record<NotificationType, { title: string; description: string }> = {
        attendance: { title: 'Yoklama', description: 'Öğrenci yoklama bildirimi' },
        schedule: { title: 'Program', description: 'Ders/etkinlik hatırlatması' },
        message: { title: 'Mesaj', description: 'Yeni mesaj bildirimi' },
        invoice: { title: 'Fatura', description: 'Fatura bildirimi' },
        alert: { title: 'Uyarı', description: 'Önemli duyuru' },
        reminder: { title: 'Hatırlatma', description: 'Genel hatırlatma' },
        report: { title: 'Rapor', description: 'Rapor hazır bildirimi' },
    };

    return NextResponse.json({ types });
}

function getDefaultTitle(type: NotificationType): string {
    const titles: Record<NotificationType, string> = {
        attendance: 'Yoklama Bildirimi',
        schedule: 'Program Hatırlatması',
        message: 'Yeni Mesaj',
        invoice: 'Fatura Bildirimi',
        alert: 'Önemli Bildirim',
        reminder: 'Hatırlatma',
        report: 'Rapor Hazır',
    };
    return titles[type] || 'Bildirim';
}
