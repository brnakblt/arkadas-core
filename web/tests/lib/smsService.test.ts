/**
 * SMS Service Tests
 * 
 * Unit tests for the SMS notification service.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SmsService, SmsNotificationType } from '@/lib/smsService';

describe('SmsService', () => {
    let smsService: SmsService;

    beforeEach(() => {
        // Create a mock SMS service
        smsService = new SmsService({ provider: 'mock' });
    });

    // ============================================================
    // Phone Number Validation Tests
    // ============================================================
    describe('Phone Number Validation', () => {
        it('should accept valid Turkish mobile numbers', async () => {
            const result = await smsService.send({ to: '5551234567', text: 'Test' });
            expect(result.success).toBe(true);
        });

        it('should accept numbers with +90 prefix', async () => {
            const result = await smsService.send({ to: '+905551234567', text: 'Test' });
            expect(result.success).toBe(true);
        });

        it('should accept numbers with 0 prefix', async () => {
            const result = await smsService.send({ to: '05551234567', text: 'Test' });
            expect(result.success).toBe(true);
        });

        it('should reject invalid phone numbers', async () => {
            const result = await smsService.send({ to: '123', text: 'Test' });
            expect(result.success).toBe(false);
            expect(result.error).toContain('Geçersiz telefon');
        });

        it('should reject non-Turkish numbers', async () => {
            const result = await smsService.send({ to: '+1234567890', text: 'Test' });
            expect(result.success).toBe(false);
        });
    });

    // ============================================================
    // Template Tests
    // ============================================================
    describe('SMS Templates', () => {
        it('should send attendance alert template', async () => {
            const result = await smsService.sendWithTemplate(
                '5551234567',
                'attendance_alert',
                { studentName: 'Ahmet', status: 'present', time: '08:30' }
            );
            expect(result.success).toBe(true);
        });

        it('should send schedule reminder template', async () => {
            const result = await smsService.sendWithTemplate(
                '5551234567',
                'schedule_reminder',
                { eventTitle: 'Toplantı', date: '2024-01-15', time: '10:00' }
            );
            expect(result.success).toBe(true);
        });

        it('should send emergency template', async () => {
            const result = await smsService.sendWithTemplate(
                '5551234567',
                'emergency',
                { title: 'Okul Kapalı', message: 'Kar yağışı nedeniyle' }
            );
            expect(result.success).toBe(true);
        });

        it('should send verification code template', async () => {
            const result = await smsService.sendWithTemplate(
                '5551234567',
                'verification_code',
                { code: '123456' }
            );
            expect(result.success).toBe(true);
        });

        it('should send payment reminder template', async () => {
            const result = await smsService.sendWithTemplate(
                '5551234567',
                'payment_reminder',
                { period: 'Ocak 2024', dueDate: '2024-01-31', amount: '1500' }
            );
            expect(result.success).toBe(true);
        });

        it('should send parent notification template', async () => {
            const result = await smsService.sendWithTemplate(
                '5551234567',
                'parent_notification',
                { studentName: 'Ayşe', message: 'Bugün çok iyi çalıştı!' }
            );
            expect(result.success).toBe(true);
        });

        it('should fail for invalid template type', async () => {
            const result = await smsService.sendWithTemplate(
                '5551234567',
                'invalid_template' as unknown as SmsNotificationType,
                {}
            );
            expect(result.success).toBe(false);
            expect(result.error).toContain('Template not found');
        });
    });

    // ============================================================
    // Bulk Send Tests
    // ============================================================
    describe('Bulk SMS', () => {
        it('should send bulk messages', async () => {
            const messages = [
                { to: '5551234567', text: 'Message 1' },
                { to: '5552345678', text: 'Message 2' },
                { to: '5553456789', text: 'Message 3' },
            ];

            const result = await smsService.sendBulk(messages);
            expect(result.sent).toBe(3);
            expect(result.failed).toBe(0);
            expect(result.results).toHaveLength(3);
        });

        it('should report failed messages in bulk', async () => {
            const messages = [
                { to: '5551234567', text: 'Valid' },
                { to: 'invalid', text: 'Invalid' },
                { to: '5553456789', text: 'Valid' },
            ];

            const result = await smsService.sendBulk(messages);
            expect(result.sent).toBe(2);
            expect(result.failed).toBe(1);
        });

        it('should send bulk with template', async () => {
            const recipients = [
                { to: '5551234567', data: { studentName: 'Ahmet', status: 'present', time: '08:30' } },
                { to: '5552345678', data: { studentName: 'Ayşe', status: 'absent', time: '08:30' } },
            ];

            const result = await smsService.sendBulkWithTemplate(recipients, 'attendance_alert');
            expect(result.sent).toBe(2);
            expect(result.failed).toBe(0);
        });
    });

    // ============================================================
    // Configuration Tests
    // ============================================================
    describe('Service Configuration', () => {
        it('should return available template types', () => {
            const types = smsService.getTemplateTypes();
            expect(types).toContain('attendance_alert');
            expect(types).toContain('schedule_reminder');
            expect(types).toContain('emergency');
            expect(types).toContain('verification_code');
            expect(types).toContain('payment_reminder');
            expect(types).toContain('parent_notification');
        });

        it('should report mock provider as configured', () => {
            expect(smsService.isConfigured()).toBe(true);
        });

        it('should report netgsm as not configured without credentials', () => {
            const netgsmService = new SmsService({ provider: 'netgsm' });
            expect(netgsmService.isConfigured()).toBe(false);
        });

        it('should report twilio as not configured without credentials', () => {
            const twilioService = new SmsService({ provider: 'twilio' });
            expect(twilioService.isConfigured()).toBe(false);
        });
    });

    // ============================================================
    // Mock Provider Tests
    // ============================================================
    describe('Mock Provider', () => {
        it('should return mock message ID', async () => {
            const result = await smsService.send({ to: '5551234567', text: 'Test' });
            expect(result.messageId).toMatch(/^mock-\d+$/);
        });

        it('should log mock messages', async () => {
            const consoleSpy = vi.spyOn(console, 'warn');
            await smsService.send({ to: '5551234567', text: 'Test message' });

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('[MOCK SMS]')
            );

            consoleSpy.mockRestore();
        });
    });
});

// ============================================================
// Provider Implementation Tests
// ============================================================
describe('Provider Implementations', () => {
    const mockFetch = vi.fn();
    global.fetch = mockFetch;

    beforeEach(() => {
        mockFetch.mockReset();
    });

    describe('Netgsm', () => {
        let netgsmService: SmsService;

        beforeEach(() => {
            netgsmService = new SmsService({
                provider: 'netgsm',
                credentials: {
                    netgsmUserCode: 'user',
                    netgsmPassword: 'pass',
                    netgsmMsgHeader: 'HEADER'
                }
            });
        });

        it('should send SMS successfully via Netgsm', async () => {
            mockFetch.mockResolvedValueOnce({
                text: () => Promise.resolve('00 123456')
            } as Response);

            const result = await netgsmService.send({ to: '5551234567', text: 'Test' });

            expect(result.success).toBe(true);
            expect(result.messageId).toBe('123456');
            expect(result.provider).toBe('netgsm');
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('api.netgsm.com.tr/sms/send/get')
            );
        });

        it('should handle Netgsm errors', async () => {
            mockFetch.mockResolvedValueOnce({
                text: () => Promise.resolve('30 Hata')
            } as Response);

            const result = await netgsmService.send({ to: '5551234567', text: 'Test' });

            expect(result.success).toBe(false);
            expect(result.error).toContain('Netgsm error: 30 Hata');
        });

        it('should fail if credentials missing', async () => {
            const badService = new SmsService({
                provider: 'netgsm',
                credentials: {}
            });
            const result = await badService.send({ to: '5551234567', text: 'Test' });
            expect(result.success).toBe(false);
            expect(result.error).toContain('credentials not configured');
        });
    });

    describe('Twilio', () => {
        let twilioService: SmsService;

        beforeEach(() => {
            twilioService = new SmsService({
                provider: 'twilio',
                credentials: {
                    twilioAccountSid: 'AC123',
                    twilioAuthToken: 'token',
                    twilioFromNumber: '+1234'
                }
            });
        });

        it('should send SMS successfully via Twilio', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ sid: 'SM123' })
            } as Response);

            const result = await twilioService.send({ to: '+905551234567', text: 'Test' });

            expect(result.success).toBe(true);
            expect(result.messageId).toBe('SM123');
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('api.twilio.com'),
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        'Authorization': expect.stringContaining('Basic')
                    })
                })
            );
        });

        it('should handle Twilio errors', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                json: () => Promise.resolve({ message: 'Invalid number' })
            } as Response);

            const result = await twilioService.send({ to: '+905551234567', text: 'Test' });

            expect(result.success).toBe(false);
            expect(result.error).toBe('Invalid number');
        });

        it('should fail if credentials missing', async () => {
            const badService = new SmsService({
                provider: 'twilio',
                credentials: {}
            });
            const result = await badService.send({ to: '5551234567', text: 'Test' });
            expect(result.success).toBe(false);
            expect(result.error).toContain('credentials not configured');
        });
    });

    describe('Ileti Merkezi', () => {
        let imService: SmsService;

        beforeEach(() => {
            imService = new SmsService({
                provider: 'iletimerkezi',
                credentials: {
                    iletimerkeziApiKey: 'key',
                    iletimerkeziSender: 'SENDER'
                }
            });
        });

        it('should send SMS successfully via Ileti Merkezi', async () => {
            mockFetch.mockResolvedValueOnce({
                json: () => Promise.resolve({
                    response: {
                        status: { code: '200' },
                        order: { id: '123' }
                    }
                })
            } as Response);

            const result = await imService.send({ to: '5551234567', text: 'Test' });

            expect(result.success).toBe(true);
            expect(result.messageId).toBe('123');
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('api.iletimerkezi.com'),
                expect.anything()
            );
        });

        it('should handle Ileti Merkezi errors', async () => {
            mockFetch.mockResolvedValueOnce({
                json: () => Promise.resolve({
                    response: {
                        status: { code: '400', message: 'Bad Request' }
                    }
                })
            } as Response);

            const result = await imService.send({ to: '5551234567', text: 'Test' });

            expect(result.success).toBe(false);
            expect(result.error).toBe('Bad Request');
        });

        it('should fail if credentials missing', async () => {
            const badService = new SmsService({
                provider: 'iletimerkezi',
                credentials: {}
            });
            const result = await badService.send({ to: '5551234567', text: 'Test' });
            expect(result.success).toBe(false);
            expect(result.error).toContain('credentials not configured');
        });
    });

    it('should handle fetch exceptions globally', async () => {
        const netgsmService = new SmsService({
            provider: 'netgsm',
            credentials: { netgsmUserCode: 'u', netgsmPassword: 'p' }
        });

        mockFetch.mockRejectedValueOnce(new Error('Network error'));

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        const result = await netgsmService.send({ to: '5551234567', text: 'Test' });

        expect(result.success).toBe(false);
        expect(result.error).toBe('Network error');
        consoleSpy.mockRestore();
    });
});

