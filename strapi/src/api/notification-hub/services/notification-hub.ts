/**
 * notification-hub service
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreService('api::notification-hub.notification-hub', ({ strapi }) => ({
    /**
     * Send WhatsApp notification (Mock/Template)
     */
    async sendWhatsApp(to: string, templateName: string, variables: Record<string, string>) {
        try {
            // 1. Fetch template from database
            const template = await strapi.db.query('api::notification-template.notification-template').findOne({
                where: { name: templateName, type: 'whatsapp' }
            });

            let body = template?.body || `Notification: ${templateName}`;

            // 2. Replace placeholders {{var}}
            Object.keys(variables).forEach(key => {
                const regex = new RegExp(`{{${key}}}`, 'g');
                body = body.replace(regex, variables[key]);
            });

            strapi.log.info(`[Notification] Sending WhatsApp to ${to}: ${body}`);
            
            // Mock API Call
            return {
                success: true,
                messageId: `WA-${Date.now()}`,
                content: body
            };
        } catch (error) {
            strapi.log.error(`[Notification] WhatsApp Failed: ${error.message}`);
            return { success: false, error: error.message };
        }
    },

    /**
     * Trigger notification for attendance log
     */
    async triggerAttendanceNotification(logId: number) {
        const log = await strapi.entityService.findOne('api::attendance-log.attendance-log', logId, {
            populate: ['student', 'student.parent']
        });

        if (!log || !log.student) return;

        const parentPhone = log.student.phone || '0000000000';
        const studentName = log.student.fullName;
        const time = new Date(log.checkInTime).toLocaleTimeString('tr-TR');

        return await this.sendWhatsApp(parentPhone, 'attendance_checkin', {
            student: studentName,
            time: time
        });
    }
}));
