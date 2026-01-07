/**
 * Admin Activity API - Recent System Activity
 * GET /api/admin/activity
 */

import { NextResponse } from 'next/server';

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';

export async function GET(request: Request) {
    const cookieHeader = request.headers.get('cookie') || '';
    const jwtMatch = cookieHeader.match(/jwt=([^;]+)/);
    const jwt = jwtMatch ? jwtMatch[1] : null;

    if (!jwt) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const headers = {
            'Authorization': `Bearer ${jwt}`,
            'Content-Type': 'application/json',
        };

        // Fetch recent audit logs
        const response = await fetch(
            `${STRAPI_URL}/api/audit-logs?sort=timestamp:desc&pagination[limit]=10&populate=*`,
            { headers }
        );

        if (!response.ok) {
            // Return mock data if audit logs not available
            return NextResponse.json({
                activity: [
                    {
                        id: '1',
                        type: 'login',
                        message: 'Sistem erişimi sağlandı',
                        user: 'Admin',
                        timestamp: new Date().toISOString(),
                    },
                ],
            });
        }

        const data = await response.json();
        const logs = data.data || [];

        interface AuditLog {
            id: number;
            documentId?: string;
            action?: string;
            attributes?: {
                action?: string;
                entityType?: string;
                metadata?: { username?: string };
                timestamp?: string;
            };
            entityType?: string;
            metadata?: { username?: string };
            timestamp?: string;
            createdAt?: string;
        }

        const activity = logs.map((log: AuditLog) => ({
            id: log.id?.toString() || log.documentId,
            type: mapActionToType(log.action || log.attributes?.action || ''),
            message: getActivityMessage(log.action || log.attributes?.action || '', log.entityType || log.attributes?.entityType || ''),
            user: log.metadata?.username || log.attributes?.metadata?.username,
            timestamp: log.timestamp || log.attributes?.timestamp || log.createdAt,
        }));

        return NextResponse.json({ activity });
    } catch (error) {
        console.error('Activity fetch error:', error);
        return NextResponse.json({ activity: [] });
    }
}

function mapActionToType(action: string): string {
    const mapping: Record<string, string> = {
        login: 'login',
        logout: 'login',
        checkin: 'checkin',
        checkout: 'checkin',
        create: 'user_created',
        update: 'schedule_updated',
        delete: 'schedule_updated',
    };
    return mapping[action] || 'schedule_updated';
}

function getActivityMessage(action: string, entityType: string): string {
    const messages: Record<string, Record<string, string>> = {
        login: { default: 'Sisteme giriş yapıldı' },
        logout: { default: 'Sistemden çıkış yapıldı' },
        checkin: { default: 'Yoklama alındı' },
        create: {
            'user': 'Yeni kullanıcı oluşturuldu',
            'student-profile': 'Yeni öğrenci eklendi',
            'schedule': 'Yeni seans oluşturuldu',
            'tenant': 'Yeni kurum eklendi',
            default: 'Yeni kayıt oluşturuldu',
        },
        update: {
            'schedule': 'Program güncellendi',
            'student-profile': 'Öğrenci bilgileri güncellendi',
            default: 'Kayıt güncellendi',
        },
        delete: { default: 'Kayıt silindi' },
    };

    const actionMessages = messages[action] || messages.update;
    return actionMessages[entityType] || actionMessages.default || 'İşlem gerçekleştirildi';
}
