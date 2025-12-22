/**
 * Arkadaş SMS Notification Service
 * 
 * SMS notification service supporting multiple Turkish SMS providers.
 * Configurable for Netgsm, Twilio, or other SMS gateways.
 */

/**
 * SMS provider types
 */
export type SmsProvider = 'netgsm' | 'twilio' | 'iletimerkezi' | 'mock';

/**
 * SMS configuration
 */
export interface SmsConfig {
    provider: SmsProvider;
    credentials: {
        // Netgsm
        netgsmUserCode?: string;
        netgsmPassword?: string;
        netgsmMsgHeader?: string;
        // Twilio
        twilioAccountSid?: string;
        twilioAuthToken?: string;
        twilioFromNumber?: string;
        // İleti Merkezi
        iletimerkeziApiKey?: string;
        iletimerkeziSender?: string;
    };
}

/**
 * SMS message payload
 */
export interface SmsMessage {
    to: string; // Phone number (Turkish format: 5xxxxxxxxx)
    text: string;
    scheduledAt?: Date;
}

/**
 * SMS send result
 */
export interface SmsSendResult {
    success: boolean;
    messageId?: string;
    error?: string;
    provider: SmsProvider;
}

/**
 * SMS notification types
 */
export type SmsNotificationType =
    | 'attendance_alert'
    | 'schedule_reminder'
    | 'emergency'
    | 'verification_code'
    | 'payment_reminder'
    | 'parent_notification';

/**
 * SMS templates
 */
const smsTemplates: Record<SmsNotificationType, (data: Record<string, unknown>) => string> = {
    attendance_alert: (data) => {
        const status = data.status === 'present' ? 'geldi' : data.status === 'absent' ? 'gelmedi' : 'geç kaldı';
        return `Arkadaş: ${data.studentName || 'Öğrenciniz'} bugün kuruma ${status}. Saat: ${data.time || '-'}`;
    },

    schedule_reminder: (data) =>
        `Arkadaş Hatırlatma: ${data.eventTitle || 'Etkinlik'} - ${data.date || 'bugün'} ${data.time || ''} tarihinde. ${data.location || ''}`.trim(),

    emergency: (data) =>
        `⚠️ ACİL - Arkadaş: ${data.title || 'Önemli Duyuru'}. ${data.message || ''}`.trim(),

    verification_code: (data) =>
        `Arkadaş doğrulama kodu: ${data.code || '------'}. Bu kod 5 dakika geçerlidir.`,

    payment_reminder: (data) =>
        `Arkadaş: ${data.period || ''} dönemi ödemeniz için son tarih ${data.dueDate || '-'}. Tutar: ${data.amount || '-'} TL`,

    parent_notification: (data) =>
        `Arkadaş - ${data.studentName || 'Öğrenciniz'}: ${data.message || 'Bilgilendirme mesajı'}`.substring(0, 160),
};

/**
 * Normalize Turkish phone number to E.164 format
 */
function normalizePhoneNumber(phone: string): string {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');

    // Handle Turkish phone formats
    if (cleaned.startsWith('90')) {
        cleaned = '+' + cleaned;
    } else if (cleaned.startsWith('0')) {
        cleaned = '+9' + cleaned;
    } else if (cleaned.startsWith('5')) {
        cleaned = '+90' + cleaned;
    } else if (!cleaned.startsWith('+')) {
        cleaned = '+90' + cleaned;
    }

    return cleaned;
}

/**
 * Validate phone number format
 */
function isValidPhoneNumber(phone: string): boolean {
    const normalized = normalizePhoneNumber(phone);
    // Turkish mobile: +905xxxxxxxxx (12 digits total)
    return /^\+905\d{9}$/.test(normalized);
}

/**
 * SMS Service Class
 */
export class SmsService {
    private config: SmsConfig;

    constructor(config?: Partial<SmsConfig>) {
        this.config = {
            provider: (process.env.SMS_PROVIDER as SmsProvider) || 'mock',
            credentials: {
                // Netgsm
                netgsmUserCode: process.env.NETGSM_USERCODE,
                netgsmPassword: process.env.NETGSM_PASSWORD,
                netgsmMsgHeader: process.env.NETGSM_MSGHEADER || 'ARKADAS',
                // Twilio
                twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
                twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
                twilioFromNumber: process.env.TWILIO_FROM_NUMBER,
                // İleti Merkezi
                iletimerkeziApiKey: process.env.ILETIMERKEZI_API_KEY,
                iletimerkeziSender: process.env.ILETIMERKEZI_SENDER,
                ...config?.credentials,
            },
        };

        if (config?.provider) {
            this.config.provider = config.provider;
        }
    }

    /**
     * Send a single SMS
     */
    async send(message: SmsMessage): Promise<SmsSendResult> {
        if (!isValidPhoneNumber(message.to)) {
            return {
                success: false,
                error: 'Geçersiz telefon numarası formatı',
                provider: this.config.provider,
            };
        }

        const normalizedNumber = normalizePhoneNumber(message.to);

        try {
            switch (this.config.provider) {
                case 'netgsm':
                    return await this.sendViaNetgsm(normalizedNumber, message.text);
                case 'twilio':
                    return await this.sendViaTwilio(normalizedNumber, message.text);
                case 'iletimerkezi':
                    return await this.sendViaIletiMerkezi(normalizedNumber, message.text);
                case 'mock':
                default:
                    return this.sendViaMock(normalizedNumber, message.text);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error(`SMS send failed: ${errorMessage}`);
            return {
                success: false,
                error: errorMessage,
                provider: this.config.provider,
            };
        }
    }

    /**
     * Send SMS using a template
     */
    async sendWithTemplate(
        to: string,
        templateType: SmsNotificationType,
        data: Record<string, unknown>
    ): Promise<SmsSendResult> {
        const template = smsTemplates[templateType];
        if (!template) {
            return {
                success: false,
                error: `Template not found: ${templateType}`,
                provider: this.config.provider,
            };
        }

        const text = template(data);
        return this.send({ to, text });
    }

    /**
     * Send bulk SMS messages
     */
    async sendBulk(
        messages: SmsMessage[]
    ): Promise<{ sent: number; failed: number; results: SmsSendResult[] }> {
        const results: SmsSendResult[] = [];
        let sent = 0;
        let failed = 0;

        for (const message of messages) {
            const result = await this.send(message);
            results.push(result);

            if (result.success) {
                sent++;
            } else {
                failed++;
            }

            // Small delay between messages
            await new Promise((resolve) => setTimeout(resolve, 100));
        }

        return { sent, failed, results };
    }

    /**
     * Send bulk SMS with template
     */
    async sendBulkWithTemplate(
        recipients: Array<{ to: string; data: Record<string, unknown> }>,
        templateType: SmsNotificationType
    ): Promise<{ sent: number; failed: number }> {
        const template = smsTemplates[templateType];
        if (!template) {
            return { sent: 0, failed: recipients.length };
        }

        const messages: SmsMessage[] = recipients.map((r) => ({
            to: r.to,
            text: template(r.data),
        }));

        const result = await this.sendBulk(messages);
        return { sent: result.sent, failed: result.failed };
    }

    /**
     * Netgsm API implementation
     */
    private async sendViaNetgsm(to: string, text: string): Promise<SmsSendResult> {
        const { netgsmUserCode, netgsmPassword, netgsmMsgHeader } = this.config.credentials;

        if (!netgsmUserCode || !netgsmPassword) {
            return {
                success: false,
                error: 'Netgsm credentials not configured',
                provider: 'netgsm',
            };
        }

        // Remove +90 prefix for Netgsm (expects 5xxxxxxxxx format)
        const phoneNumber = to.replace('+90', '');

        const params = new URLSearchParams({
            usercode: netgsmUserCode,
            password: netgsmPassword,
            gsmno: phoneNumber,
            message: text,
            msgheader: netgsmMsgHeader || 'ARKADAS',
            dil: 'TR',
        });

        const response = await fetch(
            `https://api.netgsm.com.tr/sms/send/get?${params.toString()}`
        );

        const result = await response.text();

        // Netgsm returns code-message format: 00 123456789 (success) or error code
        const isSuccess = result.startsWith('00') || result.startsWith('01') || result.startsWith('02');

        return {
            success: isSuccess,
            messageId: isSuccess ? result.split(' ')[1] : undefined,
            error: isSuccess ? undefined : `Netgsm error: ${result}`,
            provider: 'netgsm',
        };
    }

    /**
     * Twilio API implementation
     */
    private async sendViaTwilio(to: string, text: string): Promise<SmsSendResult> {
        const { twilioAccountSid, twilioAuthToken, twilioFromNumber } = this.config.credentials;

        if (!twilioAccountSid || !twilioAuthToken || !twilioFromNumber) {
            return {
                success: false,
                error: 'Twilio credentials not configured',
                provider: 'twilio',
            };
        }

        const response = await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
            {
                method: 'POST',
                headers: {
                    'Authorization': 'Basic ' + Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString('base64'),
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    To: to,
                    From: twilioFromNumber,
                    Body: text,
                }),
            }
        );

        const result = await response.json();

        if (response.ok) {
            return {
                success: true,
                messageId: result.sid,
                provider: 'twilio',
            };
        } else {
            return {
                success: false,
                error: result.message || 'Twilio error',
                provider: 'twilio',
            };
        }
    }

    /**
     * İleti Merkezi API implementation
     */
    private async sendViaIletiMerkezi(to: string, text: string): Promise<SmsSendResult> {
        const { iletimerkeziApiKey, iletimerkeziSender } = this.config.credentials;

        if (!iletimerkeziApiKey) {
            return {
                success: false,
                error: 'İleti Merkezi credentials not configured',
                provider: 'iletimerkezi',
            };
        }

        const response = await fetch('https://api.iletimerkezi.com/v1/send-sms/get/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                request: {
                    authentication: {
                        key: iletimerkeziApiKey,
                    },
                    order: {
                        sender: iletimerkeziSender || 'ARKADAS',
                        sendDateTime: '',
                        message: {
                            text,
                            receipents: {
                                number: [to.replace('+', '')],
                            },
                        },
                    },
                },
            }),
        });

        const result = await response.json();
        const isSuccess = result?.response?.status?.code === '200';

        return {
            success: isSuccess,
            messageId: result?.response?.order?.id,
            error: isSuccess ? undefined : result?.response?.status?.message,
            provider: 'iletimerkezi',
        };
    }

    /**
     * Mock implementation for testing
     */
    private sendViaMock(to: string, text: string): SmsSendResult {
        console.warn(`[MOCK SMS] To: ${to}`);
        console.warn(`[MOCK SMS] Text: ${text}`);

        return {
            success: true,
            messageId: `mock-${Date.now()}`,
            provider: 'mock',
        };
    }

    /**
     * Get available template types
     */
    getTemplateTypes(): SmsNotificationType[] {
        return Object.keys(smsTemplates) as SmsNotificationType[];
    }

    /**
     * Check if service is configured
     */
    isConfigured(): boolean {
        const { provider, credentials } = this.config;

        switch (provider) {
            case 'netgsm':
                return !!(credentials.netgsmUserCode && credentials.netgsmPassword);
            case 'twilio':
                return !!(credentials.twilioAccountSid && credentials.twilioAuthToken && credentials.twilioFromNumber);
            case 'iletimerkezi':
                return !!credentials.iletimerkeziApiKey;
            case 'mock':
                return true;
            default:
                return false;
        }
    }
}

// Export singleton instance
export const smsService = new SmsService();
export default smsService;
