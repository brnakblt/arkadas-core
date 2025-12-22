/**
 * WhatsApp Notifications API
 * Send notifications to parents via WhatsApp
 */

import { NextRequest, NextResponse } from 'next/server';
import {
    sendTextMessage,
    sendTemplateMessage,
    sendAttendanceNotification,
    sendAppointmentReminder,
    sendAnnouncement,
    isValidPhoneNumber,
} from '@/lib/whatsapp';

// POST /api/v1/notifications/whatsapp
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { type, to, ...params } = body;

        if (!to) {
            return NextResponse.json(
                { success: false, error: 'Telefon numarası gerekli' },
                { status: 400 }
            );
        }

        if (!isValidPhoneNumber(to)) {
            return NextResponse.json(
                { success: false, error: 'Geçersiz telefon numarası' },
                { status: 400 }
            );
        }

        let result;

        switch (type) {
            case 'text':
                result = await sendTextMessage(to, params.message);
                break;

            case 'template':
                result = await sendTemplateMessage(
                    to,
                    params.templateName,
                    params.parameters || [],
                    params.language || 'tr'
                );
                break;

            case 'attendance':
                result = await sendAttendanceNotification(
                    to,
                    params.studentName,
                    params.status,
                    params.date
                );
                break;

            case 'appointment':
                result = await sendAppointmentReminder(
                    to,
                    params.studentName,
                    params.teacherName,
                    params.date,
                    params.time
                );
                break;

            case 'announcement':
                result = await sendAnnouncement(
                    to,
                    params.title,
                    params.message
                );
                break;

            default:
                return NextResponse.json(
                    { success: false, error: 'Geçersiz bildirim tipi' },
                    { status: 400 }
                );
        }

        if (result.success) {
            return NextResponse.json({
                success: true,
                messageId: result.messageId,
            });
        } else {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('WhatsApp notification error:', error);
        return NextResponse.json(
            { success: false, error: 'Bildirim gönderilemedi' },
            { status: 500 }
        );
    }
}
