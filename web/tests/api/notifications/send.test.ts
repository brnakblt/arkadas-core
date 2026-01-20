
import { POST } from '@/app/api/notifications/send/route';
import { NextRequest } from 'next/server';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock everything needed
vi.mock('next/headers', () => ({
    cookies: () => ({
        get: () => ({ value: 'valid-token' })
    })
}));

// Mock the queue lib (dynamic import)
vi.mock('@/lib/queue', () => ({
    addNotificationJob: vi.fn().mockResolvedValue({ id: '123' })
}));

// Mock Global Fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('POST /api/notifications/send (Batch Processing)', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Robust mock implementation
        mockFetch.mockImplementation(async (url: string | URL) => {
            const urlStr = url.toString();

            if (urlStr.includes('/api/users/me')) {
                return {
                    ok: true,
                    json: async () => ({ id: 1, tenant: { id: 1, name: 'Test Tenant' } })
                };
            }

            // Default "users" target response (override in tests if needed)
            if (urlStr.includes('/api/users?')) {
                return { ok: true, json: async () => [] };
            }

            // Notification POST response
            if (urlStr.includes('/api/notifications')) {
                return {
                    ok: true,
                    json: async () => ({ id: 1 })
                };
            }

            return { ok: false, status: 404 };
        });
    });

    it('should offload to queue if user count > 5', async () => {
        // Override for large batch
        mockFetch.mockImplementation(async (url: string | URL) => {
            const urlStr = url.toString();
            if (urlStr.includes('/api/users/me')) return { ok: true, json: async () => ({ id: 1, tenant: { id: 1 } }) };
            if (urlStr.includes('/api/users?')) {
                return { ok: true, json: async () => Array.from({ length: 10 }).map((_, i) => ({ id: i + 1, email: `u${i}@t.com` })) };
            }
            // Fallback
            return { ok: true, json: async () => ({}) };
        });

        const req = new NextRequest('http://localhost/api/notifications/send', {
            method: 'POST',
            body: JSON.stringify({
                type: 'alert',
                message: 'Hello Everyone'
            })
        });

        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.queued).toBe(true);
        expect(data.message).toContain('Bulk notification queued');
    });

    it('should process inline if user count <= 5', async () => {
        // Override for small batch
        mockFetch.mockImplementation(async (url: string | URL) => {
            const urlStr = url.toString();
            if (urlStr.includes('/api/users/me')) return { ok: true, json: async () => ({ id: 1, tenant: { id: 1 } }) };
            if (urlStr.includes('/api/users?')) {
                return { ok: true, json: async () => Array.from({ length: 3 }).map((_, i) => ({ id: i + 1, email: `u${i}@t.com` })) };
            }
            if (urlStr.includes('/api/notifications')) return { ok: true, json: async () => ({ id: 1 }) };
            return { ok: true, json: async () => ({}) };
        });

        const req = new NextRequest('http://localhost/api/notifications/send', {
            method: 'POST',
            body: JSON.stringify({
                type: 'alert',
                message: 'Small batch'
            })
        });

        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.queued).toBeUndefined(); // Should NOT be queued
        expect(data.sent).toBe(3);
    });
});
