/**
 * Arkadaş Email Notification Service
 * 
 * Email template system for sending notifications to users.
 * Uses Strapi's built-in email plugin with custom templates.
 */

import type { Core } from '@strapi/strapi';

/**
 * Email template types
 */
export type EmailTemplateType =
    | 'welcome'
    | 'password_reset'
    | 'attendance_notification'
    | 'schedule_reminder'
    | 'invoice_notification'
    | 'parent_notification'
    | 'report_ready'
    | 'emergency_alert';

/**
 * Email template data interfaces
 */
export interface BaseEmailData {
    recipientName: string;
    recipientEmail: string;
}

export interface WelcomeEmailData extends BaseEmailData {
    username: string;
    loginUrl: string;
}

export interface PasswordResetEmailData extends BaseEmailData {
    resetUrl: string;
    expiresIn: string;
}

export interface AttendanceEmailData extends BaseEmailData {
    studentName: string;
    checkInTime?: string;
    checkOutTime?: string;
    status: 'present' | 'absent' | 'late';
    date: string;
}

export interface ScheduleReminderData extends BaseEmailData {
    eventTitle: string;
    eventDate: string;
    eventTime: string;
    location?: string;
    description?: string;
}

export interface InvoiceEmailData extends BaseEmailData {
    invoiceNumber: string;
    amount: string;
    dueDate: string;
    period: string;
    downloadUrl?: string;
}

export interface ParentNotificationData extends BaseEmailData {
    studentName: string;
    notificationType: 'progress' | 'behavior' | 'health' | 'general';
    message: string;
    teacherName?: string;
    actionRequired?: boolean;
}

export interface ReportReadyData extends BaseEmailData {
    reportType: string;
    studentName: string;
    period: string;
    downloadUrl?: string;
}

export interface EmergencyAlertData extends BaseEmailData {
    alertType: 'weather' | 'closure' | 'security' | 'health';
    title: string;
    message: string;
    immediateAction?: string;
}

type EmailData =
    | WelcomeEmailData
    | PasswordResetEmailData
    | AttendanceEmailData
    | ScheduleReminderData
    | InvoiceEmailData
    | ParentNotificationData
    | ReportReadyData
    | EmergencyAlertData;

/**
 * Email templates with Turkish content
 */
const emailTemplates: Record<EmailTemplateType, {
    subject: (data: EmailData) => string;
    html: (data: EmailData) => string;
    text: (data: EmailData) => string;
}> = {
    welcome: {
        subject: (data) => `Hoş Geldiniz, ${(data as WelcomeEmailData).recipientName}!`,
        html: (data) => {
            const d = data as WelcomeEmailData;
            return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #2563eb;">Arkadaş Özel Eğitim'e Hoş Geldiniz! 🎉</h1>
    <p>Merhaba ${d.recipientName},</p>
    <p>Arkadaş Özel Eğitim ERP sistemine başarıyla kayıt oldunuz.</p>
    <p><strong>Kullanıcı Adınız:</strong> ${d.username}</p>
    <p>Sisteme giriş yapmak için aşağıdaki bağlantıyı kullanabilirsiniz:</p>
    <a href="${d.loginUrl}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px;">Giriş Yap</a>
    <p style="margin-top: 30px;">Saygılarımızla,<br>Arkadaş Özel Eğitim Ekibi</p>
  </div>
</body>
</html>`;
        },
        text: (data) => {
            const d = data as WelcomeEmailData;
            return `Merhaba ${d.recipientName},\n\nArkadaş Özel Eğitim ERP sistemine başarıyla kayıt oldunuz.\n\nKullanıcı Adınız: ${d.username}\n\nGiriş yapmak için: ${d.loginUrl}\n\nSaygılarımızla,\nArkadaş Özel Eğitim Ekibi`;
        },
    },

    password_reset: {
        subject: () => 'Şifre Sıfırlama Talebi - Arkadaş Özel Eğitim',
        html: (data) => {
            const d = data as PasswordResetEmailData;
            return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #dc2626;">Şifre Sıfırlama 🔐</h1>
    <p>Merhaba ${d.recipientName},</p>
    <p>Şifrenizi sıfırlamak için bir talep aldık. Şifrenizi sıfırlamak için aşağıdaki bağlantıya tıklayın:</p>
    <a href="${d.resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #dc2626; color: white; text-decoration: none; border-radius: 6px;">Şifremi Sıfırla</a>
    <p style="color: #666; font-size: 14px; margin-top: 20px;">Bu bağlantı ${d.expiresIn} sonra geçerliliğini yitirecektir.</p>
    <p style="color: #666; font-size: 14px;">Bu talebi siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.</p>
    <p style="margin-top: 30px;">Saygılarımızla,<br>Arkadaş Özel Eğitim Ekibi</p>
  </div>
</body>
</html>`;
        },
        text: (data) => {
            const d = data as PasswordResetEmailData;
            return `Merhaba ${d.recipientName},\n\nŞifrenizi sıfırlamak için: ${d.resetUrl}\n\nBu bağlantı ${d.expiresIn} sonra geçerliliğini yitirecektir.\n\nSaygılarımızla,\nArkadaş Özel Eğitim Ekibi`;
        },
    },

    attendance_notification: {
        subject: (data) => {
            const d = data as AttendanceEmailData;
            const statusText = d.status === 'present' ? 'Geldi' : d.status === 'absent' ? 'Gelmedi' : 'Geç Kaldı';
            return `Yoklama Bildirimi: ${d.studentName} - ${statusText}`;
        },
        html: (data) => {
            const d = data as AttendanceEmailData;
            const statusText = d.status === 'present' ? '✅ Geldi' : d.status === 'absent' ? '❌ Gelmedi' : '⏰ Geç Kaldı';
            const statusColor = d.status === 'present' ? '#16a34a' : d.status === 'absent' ? '#dc2626' : '#f59e0b';
            return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #2563eb;">Yoklama Bildirimi 📋</h1>
    <p>Merhaba ${d.recipientName},</p>
    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p><strong>Öğrenci:</strong> ${d.studentName}</p>
      <p><strong>Tarih:</strong> ${d.date}</p>
      <p><strong>Durum:</strong> <span style="color: ${statusColor}; font-weight: bold;">${statusText}</span></p>
      ${d.checkInTime ? `<p><strong>Giriş Saati:</strong> ${d.checkInTime}</p>` : ''}
      ${d.checkOutTime ? `<p><strong>Çıkış Saati:</strong> ${d.checkOutTime}</p>` : ''}
    </div>
    <p style="margin-top: 30px;">Saygılarımızla,<br>Arkadaş Özel Eğitim</p>
  </div>
</body>
</html>`;
        },
        text: (data) => {
            const d = data as AttendanceEmailData;
            const statusText = d.status === 'present' ? 'Geldi' : d.status === 'absent' ? 'Gelmedi' : 'Geç Kaldı';
            return `Merhaba ${d.recipientName},\n\nÖğrenci: ${d.studentName}\nTarih: ${d.date}\nDurum: ${statusText}\n${d.checkInTime ? `Giriş: ${d.checkInTime}\n` : ''}${d.checkOutTime ? `Çıkış: ${d.checkOutTime}` : ''}\n\nSaygılarımızla,\nArkadaş Özel Eğitim`;
        },
    },

    schedule_reminder: {
        subject: (data) => `Hatırlatma: ${(data as ScheduleReminderData).eventTitle} - ${(data as ScheduleReminderData).eventDate}`,
        html: (data) => {
            const d = data as ScheduleReminderData;
            return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #7c3aed;">Etkinlik Hatırlatması 🗓️</h1>
    <p>Merhaba ${d.recipientName},</p>
    <p>Yaklaşan etkinliğinizi hatırlatmak istiyoruz:</p>
    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #7c3aed;">
      <h2 style="margin-top: 0;">${d.eventTitle}</h2>
      <p>📅 <strong>Tarih:</strong> ${d.eventDate}</p>
      <p>⏰ <strong>Saat:</strong> ${d.eventTime}</p>
      ${d.location ? `<p>📍 <strong>Yer:</strong> ${d.location}</p>` : ''}
      ${d.description ? `<p>${d.description}</p>` : ''}
    </div>
    <p style="margin-top: 30px;">Saygılarımızla,<br>Arkadaş Özel Eğitim</p>
  </div>
</body>
</html>`;
        },
        text: (data) => {
            const d = data as ScheduleReminderData;
            return `Merhaba ${d.recipientName},\n\nEtkinlik: ${d.eventTitle}\nTarih: ${d.eventDate}\nSaat: ${d.eventTime}\n${d.location ? `Yer: ${d.location}\n` : ''}${d.description ? `${d.description}\n` : ''}\n\nSaygılarımızla,\nArkadaş Özel Eğitim`;
        },
    },

    invoice_notification: {
        subject: (data) => `Fatura Bildirimi - ${(data as InvoiceEmailData).period}`,
        html: (data) => {
            const d = data as InvoiceEmailData;
            return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #059669;">Fatura Bildirimi 💰</h1>
    <p>Merhaba ${d.recipientName},</p>
    <p>${d.period} dönemi için faturanız hazırlanmıştır.</p>
    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p><strong>Fatura No:</strong> ${d.invoiceNumber}</p>
      <p><strong>Dönem:</strong> ${d.period}</p>
      <p><strong>Tutar:</strong> <span style="color: #059669; font-size: 24px; font-weight: bold;">${d.amount} ₺</span></p>
      <p><strong>Son Ödeme Tarihi:</strong> ${d.dueDate}</p>
    </div>
    ${d.downloadUrl ? `<a href="${d.downloadUrl}" style="display: inline-block; padding: 12px 24px; background-color: #059669; color: white; text-decoration: none; border-radius: 6px;">Faturayı İndir</a>` : ''}
    <p style="margin-top: 30px;">Saygılarımızla,<br>Arkadaş Özel Eğitim</p>
  </div>
</body>
</html>`;
        },
        text: (data) => {
            const d = data as InvoiceEmailData;
            return `Merhaba ${d.recipientName},\n\n${d.period} dönemi faturanız:\n\nFatura No: ${d.invoiceNumber}\nTutar: ${d.amount} ₺\nSon Ödeme: ${d.dueDate}\n\n${d.downloadUrl ? `İndirmek için: ${d.downloadUrl}` : ''}\n\nSaygılarımızla,\nArkadaş Özel Eğitim`;
        },
    },

    parent_notification: {
        subject: (data) => {
            const d = data as ParentNotificationData;
            const typeText = {
                progress: 'Gelişim',
                behavior: 'Davranış',
                health: 'Sağlık',
                general: 'Bilgilendirme',
            }[d.notificationType];
            return `${typeText} Bildirimi - ${d.studentName}`;
        },
        html: (data) => {
            const d = data as ParentNotificationData;
            const typeEmoji = {
                progress: '📈',
                behavior: '💬',
                health: '🏥',
                general: '📝',
            }[d.notificationType];
            return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #2563eb;">Veli Bilgilendirmesi ${typeEmoji}</h1>
    <p>Sayın ${d.recipientName},</p>
    <p><strong>${d.studentName}</strong> ile ilgili bilgilendirme:</p>
    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; ${d.actionRequired ? 'border-left: 4px solid #dc2626;' : ''}">
      <p>${d.message}</p>
      ${d.teacherName ? `<p style="color: #666; font-size: 14px;">- ${d.teacherName}</p>` : ''}
    </div>
    ${d.actionRequired ? '<p style="color: #dc2626; font-weight: bold;">⚠️ Bu bildirim işlem gerektirmektedir.</p>' : ''}
    <p style="margin-top: 30px;">Saygılarımızla,<br>Arkadaş Özel Eğitim</p>
  </div>
</body>
</html>`;
        },
        text: (data) => {
            const d = data as ParentNotificationData;
            return `Sayın ${d.recipientName},\n\n${d.studentName} ile ilgili:\n\n${d.message}\n\n${d.teacherName ? `- ${d.teacherName}` : ''}\n\n${d.actionRequired ? '⚠️ İşlem gerekli!\n' : ''}\nSaygılarımızla,\nArkadaş Özel Eğitim`;
        },
    },

    report_ready: {
        subject: (data) => `${(data as ReportReadyData).reportType} Raporu Hazır - ${(data as ReportReadyData).studentName}`,
        html: (data) => {
            const d = data as ReportReadyData;
            return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #2563eb;">Rapor Hazır 📊</h1>
    <p>Merhaba ${d.recipientName},</p>
    <p><strong>${d.studentName}</strong> için <strong>${d.reportType}</strong> raporu hazırlanmıştır.</p>
    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p><strong>Dönem:</strong> ${d.period}</p>
    </div>
    ${d.downloadUrl ? `<a href="${d.downloadUrl}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px;">Raporu İndir</a>` : ''}
    <p style="margin-top: 30px;">Saygılarımızla,<br>Arkadaş Özel Eğitim</p>
  </div>
</body>
</html>`;
        },
        text: (data) => {
            const d = data as ReportReadyData;
            return `Merhaba ${d.recipientName},\n\n${d.studentName} için ${d.reportType} raporu hazır.\n\nDönem: ${d.period}\n${d.downloadUrl ? `İndirmek için: ${d.downloadUrl}` : ''}\n\nSaygılarımızla,\nArkadaş Özel Eğitim`;
        },
    },

    emergency_alert: {
        subject: (data) => `⚠️ ACİL: ${(data as EmergencyAlertData).title}`,
        html: (data) => {
            const d = data as EmergencyAlertData;
            const alertColor = {
                weather: '#f59e0b',
                closure: '#dc2626',
                security: '#dc2626',
                health: '#059669',
            }[d.alertType];
            return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: ${alertColor};">⚠️ ACİL BİLDİRİM</h1>
    <p>Merhaba ${d.recipientName},</p>
    <div style="background: ${alertColor}20; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${alertColor};">
      <h2 style="margin-top: 0; color: ${alertColor};">${d.title}</h2>
      <p>${d.message}</p>
      ${d.immediateAction ? `<p style="font-weight: bold; color: ${alertColor};">Yapılması Gereken: ${d.immediateAction}</p>` : ''}
    </div>
    <p style="margin-top: 30px;">Arkadaş Özel Eğitim Yönetimi</p>
  </div>
</body>
</html>`;
        },
        text: (data) => {
            const d = data as EmergencyAlertData;
            return `⚠️ ACİL BİLDİRİM\n\nMerhaba ${d.recipientName},\n\n${d.title}\n\n${d.message}\n\n${d.immediateAction ? `Yapılması Gereken: ${d.immediateAction}` : ''}\n\nArkadaş Özel Eğitim Yönetimi`;
        },
    },
};

/**
 * Email notification service factory
 */
export default ({ strapi }: { strapi: Core.Strapi }) => ({
    /**
     * Send an email using a template
     */
    async sendEmail<T extends EmailTemplateType>(
        templateType: T,
        data: EmailData,
        options?: { replyTo?: string }
    ): Promise<{ success: boolean; error?: string }> {
        try {
            const template = emailTemplates[templateType];

            if (!template) {
                throw new Error(`Template not found: ${templateType}`);
            }

            await strapi.plugins['email'].services.email.send({
                to: data.recipientEmail,
                subject: template.subject(data),
                html: template.html(data),
                text: template.text(data),
                ...(options?.replyTo && { replyTo: options.replyTo }),
            });

            strapi.log.info(`Email sent: ${templateType} to ${data.recipientEmail}`);
            return { success: true };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            strapi.log.error(`Email failed: ${templateType} - ${errorMessage}`);
            return { success: false, error: errorMessage };
        }
    },

    /**
     * Send bulk emails
     */
    async sendBulkEmails<T extends EmailTemplateType>(
        templateType: T,
        recipients: EmailData[],
        options?: { replyTo?: string; delayMs?: number }
    ): Promise<{ sent: number; failed: number; errors: string[] }> {
        const results = { sent: 0, failed: 0, errors: [] as string[] };
        const delay = options?.delayMs || 100;

        for (const recipient of recipients) {
            const result = await this.sendEmail(templateType, recipient, options);

            if (result.success) {
                results.sent++;
            } else {
                results.failed++;
                results.errors.push(`${recipient.recipientEmail}: ${result.error}`);
            }

            // Small delay between emails to avoid rate limiting
            await new Promise((resolve) => setTimeout(resolve, delay));
        }

        return results;
    },

    /**
     * Get available template types
     */
    getTemplateTypes(): EmailTemplateType[] {
        return Object.keys(emailTemplates) as EmailTemplateType[];
    },

    /**
     * Preview a template with sample data
     */
    previewTemplate(templateType: EmailTemplateType, data: EmailData): {
        subject: string;
        html: string;
        text: string;
    } {
        const template = emailTemplates[templateType];

        if (!template) {
            throw new Error(`Template not found: ${templateType}`);
        }

        return {
            subject: template.subject(data),
            html: template.html(data),
            text: template.text(data),
        };
    },
});
