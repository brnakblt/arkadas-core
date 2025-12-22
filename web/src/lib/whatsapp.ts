/**
 * WhatsApp Business Cloud API Client
 * For sending notifications to parents via WhatsApp
 * 
 * Requires:
 * - WHATSAPP_PHONE_NUMBER_ID: Your WhatsApp Business phone number ID
 * - WHATSAPP_ACCESS_TOKEN: Meta access token
 * - WHATSAPP_BUSINESS_ACCOUNT_ID: Your WhatsApp Business Account ID
 */

const WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0';
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || '';

export interface WhatsAppMessage {
    to: string; // Phone number with country code (e.g., 905551234567)
    type: 'text' | 'template';
    text?: { body: string };
    template?: {
        name: string;
        language: { code: string };
        components?: TemplateComponent[];
    };
}

export interface TemplateComponent {
    type: 'header' | 'body' | 'button';
    parameters?: TemplateParameter[];
}

export interface TemplateParameter {
    type: 'text' | 'image' | 'document';
    text?: string;
    image?: { link: string };
}

export interface SendResult {
    success: boolean;
    messageId?: string;
    error?: string;
}

/**
 * Send a WhatsApp message
 */
export const sendMessage = async (message: WhatsAppMessage): Promise<SendResult> => {
    if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
        console.warn('WhatsApp credentials not configured');
        return { success: false, error: 'WhatsApp yapılandırılmamış' };
    }

    try {
        const response = await fetch(
            `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${ACCESS_TOKEN}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messaging_product: 'whatsapp',
                    recipient_type: 'individual',
                    to: message.to,
                    type: message.type,
                    ...(message.type === 'text' && { text: message.text }),
                    ...(message.type === 'template' && { template: message.template }),
                }),
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error('WhatsApp API error:', data);
            return {
                success: false,
                error: data.error?.message || 'Mesaj gönderilemedi'
            };
        }

        return {
            success: true,
            messageId: data.messages?.[0]?.id,
        };
    } catch (error) {
        console.error('WhatsApp send error:', error);
        return { success: false, error: 'Bağlantı hatası' };
    }
};

/**
 * Send a text message (only for existing conversations within 24h window)
 */
export const sendTextMessage = async (to: string, text: string): Promise<SendResult> => {
    return sendMessage({
        to: formatPhoneNumber(to),
        type: 'text',
        text: { body: text },
    });
};

/**
 * Send a template message (can initiate conversations)
 */
export const sendTemplateMessage = async (
    to: string,
    templateName: string,
    parameters: string[] = [],
    language: string = 'tr'
): Promise<SendResult> => {
    const components: TemplateComponent[] = parameters.length > 0
        ? [{
            type: 'body',
            parameters: parameters.map(p => ({ type: 'text', text: p })),
        }]
        : [];

    return sendMessage({
        to: formatPhoneNumber(to),
        type: 'template',
        template: {
            name: templateName,
            language: { code: language },
            components,
        },
    });
};

// ============================================================================
// Pre-defined notification templates
// ============================================================================

/**
 * Send attendance notification to parent
 */
export const sendAttendanceNotification = async (
    parentPhone: string,
    studentName: string,
    status: 'present' | 'absent',
    date: string
): Promise<SendResult> => {
    // Using template: attendance_notification
    // Template text: "{{1}} adlı öğrencinin {{2}} tarihli yoklama durumu: {{3}}"
    const statusText = status === 'present' ? 'Geldi ✅' : 'Gelmedi ❌';

    return sendTemplateMessage(
        parentPhone,
        'attendance_notification',
        [studentName, date, statusText]
    );
};

/**
 * Send appointment reminder to parent
 */
export const sendAppointmentReminder = async (
    parentPhone: string,
    studentName: string,
    teacherName: string,
    date: string,
    time: string
): Promise<SendResult> => {
    // Using template: appointment_reminder
    // Template text: "Sayın veli, {{1}} için {{2}} öğretmenimizle {{3}} tarihinde saat {{4}}'de randevunuz var."
    return sendTemplateMessage(
        parentPhone,
        'appointment_reminder',
        [studentName, teacherName, date, time]
    );
};

/**
 * Send appointment confirmation
 */
export const sendAppointmentConfirmation = async (
    parentPhone: string,
    date: string,
    time: string
): Promise<SendResult> => {
    // Using template: appointment_confirmed
    return sendTemplateMessage(
        parentPhone,
        'appointment_confirmed',
        [date, time]
    );
};

/**
 * Send general announcement
 */
export const sendAnnouncement = async (
    parentPhone: string,
    title: string,
    message: string
): Promise<SendResult> => {
    // Using template: school_announcement
    return sendTemplateMessage(
        parentPhone,
        'school_announcement',
        [title, message]
    );
};

/**
 * Send service route update
 */
export const sendRouteUpdate = async (
    parentPhone: string,
    studentName: string,
    estimatedTime: string
): Promise<SendResult> => {
    // Using template: service_update
    // Template text: "{{1}} için servis tahmini varış: {{2}}"
    return sendTemplateMessage(
        parentPhone,
        'service_update',
        [studentName, estimatedTime]
    );
};

// ============================================================================
// Helpers
// ============================================================================

/**
 * Format phone number for WhatsApp API
 * Converts Turkish formats to international format
 */
const formatPhoneNumber = (phone: string): string => {
    // Remove all non-digits
    let cleaned = phone.replace(/\D/g, '');

    // Handle Turkish numbers
    if (cleaned.startsWith('0')) {
        cleaned = '90' + cleaned.slice(1);
    } else if (!cleaned.startsWith('90') && cleaned.length === 10) {
        cleaned = '90' + cleaned;
    }

    return cleaned;
};

/**
 * Validate phone number format
 */
export const isValidPhoneNumber = (phone: string): boolean => {
    const cleaned = formatPhoneNumber(phone);
    // Turkish mobile numbers: 90 5XX XXX XXXX (12 digits)
    return /^90[5][0-9]{9}$/.test(cleaned);
};

export default {
    sendMessage,
    sendTextMessage,
    sendTemplateMessage,
    sendAttendanceNotification,
    sendAppointmentReminder,
    sendAppointmentConfirmation,
    sendAnnouncement,
    sendRouteUpdate,
    isValidPhoneNumber,
};
