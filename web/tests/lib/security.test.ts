/**
 * Security Utilities Tests
 * 
 * Unit tests for the security middleware and utilities.
 */

import { describe, it, expect } from 'vitest';
import {
    generateCsrfToken,
    escapeHtml,
    sanitizeString,
    sanitizeObject,
    sanitizeUrl,
    sanitizeFilename,
    validateContentType,
    validateOrigin,
    addSecurityHeaders,
    validateCsrfToken,
    csrfMiddleware,
    parseJsonBody,
} from '@/lib/security';

describe('Security Utilities', () => {
    // ============================================================
    // CSRF Token Tests
    // ============================================================
    describe('generateCsrfToken', () => {
        it('should generate a 64-character hex string', () => {
            const token = generateCsrfToken();
            expect(token).toHaveLength(64);
            expect(/^[a-f0-9]+$/.test(token)).toBe(true);
        });

        it('should generate unique tokens each time', () => {
            const token1 = generateCsrfToken();
            const token2 = generateCsrfToken();
            expect(token1).not.toBe(token2);
        });
    });

    // ============================================================
    // HTML Escaping Tests
    // ============================================================
    describe('escapeHtml', () => {
        it('should escape < and >', () => {
            expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
        });

        it('should escape quotes', () => {
            expect(escapeHtml('He said "Hello"')).toBe('He said &quot;Hello&quot;');
            expect(escapeHtml("It's fine")).toBe('It&#x27;s fine');
        });

        it('should escape ampersand', () => {
            expect(escapeHtml('A & B')).toBe('A &amp; B');
        });

        it('should handle empty strings', () => {
            expect(escapeHtml('')).toBe('');
        });

        it('should pass through normal text', () => {
            expect(escapeHtml('Hello World')).toBe('Hello World');
        });

        it('should escape multiple special characters', () => {
            const input = '<script>alert("XSS")</script>';
            const expected = '&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;';
            expect(escapeHtml(input)).toBe(expected);
        });
    });

    // ============================================================
    // String Sanitization Tests
    // ============================================================
    describe('sanitizeString', () => {
        it('should remove script tags', () => {
            const input = 'Hello <script>alert("xss")</script> World';
            expect(sanitizeString(input)).toBe('Hello  World');
        });

        it('should remove null bytes', () => {
            expect(sanitizeString('Hello\0World')).toBe('HelloWorld');
        });

        it('should remove javascript: URLs', () => {
            expect(sanitizeString('javascript:alert(1)')).toBe('alert(1)');
        });

        it('should remove inline event handlers', () => {
            const input = '<img onerror="alert(1)" src="x">';
            expect(sanitizeString(input)).not.toContain('onerror');
        });

        it('should trim whitespace', () => {
            expect(sanitizeString('  Hello  ')).toBe('Hello');
        });

        it('should handle empty strings', () => {
            expect(sanitizeString('')).toBe('');
        });
    });

    // ============================================================
    // Object Sanitization Tests
    // ============================================================
    describe('sanitizeObject', () => {
        it('should sanitize string values in objects', () => {
            const input = { name: '<script>bad</script>User' };
            const result = sanitizeObject(input);
            expect(result.name).not.toContain('<script>');
        });

        it('should handle nested objects', () => {
            const input = {
                user: {
                    name: '<script>bad</script>',
                    email: 'test@test.com',
                },
            };
            const result = sanitizeObject(input);
            expect(result.user.name).not.toContain('<script>');
            expect(result.user.email).toBe('test@test.com');
        });

        it('should handle arrays', () => {
            const input = {
                items: ['<script>1</script>', 'safe'],
            };
            const result = sanitizeObject(input);
            expect(result.items[0]).not.toContain('<script>');
            expect(result.items[1]).toBe('safe');
        });

        it('should preserve non-string values', () => {
            const input = { count: 42, active: true, date: null };
            const result = sanitizeObject(input);
            expect(result.count).toBe(42);
            expect(result.active).toBe(true);
            expect(result.date).toBe(null);
        });
    });

    // ============================================================
    // URL Sanitization Tests
    // ============================================================
    describe('sanitizeUrl', () => {
        it('should allow http URLs', () => {
            const url = 'http://example.com/page';
            expect(sanitizeUrl(url)).toBe(url);
        });

        it('should allow https URLs', () => {
            const url = 'https://example.com/page';
            expect(sanitizeUrl(url)).toBe(url);
        });

        it('should reject javascript URLs', () => {
            expect(sanitizeUrl('javascript:alert(1)')).toBe(null);
        });

        it('should reject data URLs by default', () => {
            expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBe(null);
        });

        it('should reject invalid URLs', () => {
            expect(sanitizeUrl('not-a-url')).toBe(null);
        });

        it('should allow custom protocols', () => {
            const url = 'ftp://files.example.com';
            expect(sanitizeUrl(url, ['ftp:'])).toBe(url + '/');
        });
    });

    // ============================================================
    // Filename Sanitization Tests
    // ============================================================
    describe('sanitizeFilename', () => {
        it('should remove path traversal attempts', () => {
            expect(sanitizeFilename('../../../etc/passwd')).toBe('etcpasswd');
        });

        it('should remove slashes', () => {
            expect(sanitizeFilename('path/to/file')).toBe('pathtofile');
            expect(sanitizeFilename('path\\to\\file')).toBe('pathtofile');
        });

        it('should allow safe characters', () => {
            expect(sanitizeFilename('document.pdf')).toBe('document.pdf');
            expect(sanitizeFilename('file-name_123.txt')).toBe('file-name_123.txt');
        });

        it('should replace unsafe characters with underscore', () => {
            expect(sanitizeFilename('file name.txt')).toBe('file_name.txt');
            expect(sanitizeFilename('file@name.txt')).toBe('file_name.txt');
        });

        it('should limit filename length to 255 characters', () => {
            const longName = 'a'.repeat(300);
            expect(sanitizeFilename(longName)).toHaveLength(255);
        });
    });

    // ============================================================
    // Content-Type Validation Tests
    // ============================================================
    describe('validateContentType', () => {
        it('should accept application/json', () => {
            const request = new Request('http://test.com', {
                headers: { 'Content-Type': 'application/json' },
            });
            expect(validateContentType(request)).toBe(true);
        });

        it('should accept application/json with charset', () => {
            const request = new Request('http://test.com', {
                headers: { 'Content-Type': 'application/json; charset=utf-8' },
            });
            expect(validateContentType(request)).toBe(true);
        });

        it('should reject text/html by default', () => {
            const request = new Request('http://test.com', {
                headers: { 'Content-Type': 'text/html' },
            });
            expect(validateContentType(request)).toBe(false);
        });

        it('should accept custom content types', () => {
            const request = new Request('http://test.com', {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            expect(validateContentType(request, ['multipart/form-data'])).toBe(true);
        });

        it('should reject when no content-type header', () => {
            const request = new Request('http://test.com');
            expect(validateContentType(request)).toBe(false);
        });
    });

    // ============================================================
    // Origin Validation Tests
    // ============================================================
    describe('validateOrigin', () => {
        it('should accept same-origin requests (no origin header)', () => {
            const request = new Request('http://test.com');
            expect(validateOrigin(request, ['http://allowed.com'])).toBe(true);
        });

        it('should accept allowed origins', () => {
            const request = new Request('http://test.com', {
                headers: { Origin: 'http://allowed.com' },
            });
            expect(validateOrigin(request, ['http://allowed.com'])).toBe(true);
        });

        it('should reject disallowed origins', () => {
            const request = new Request('http://test.com', {
                headers: { Origin: 'http://evil.com' },
            });
            expect(validateOrigin(request, ['http://allowed.com'])).toBe(false);
        });

        it('should accept wildcard origin', () => {
            const request = new Request('http://test.com', {
                headers: { Origin: 'http://any.com' },
            });
            expect(validateOrigin(request, ['*'])).toBe(true);
        });

        it('should handle subdomain wildcards', () => {
            const request = new Request('http://test.com', {
                headers: { Origin: 'http://sub.example.com' },
            });
            expect(validateOrigin(request, ['http://*.example.com'])).toBe(true);
        });
    });

    // ============================================================
    // Security Headers Tests
    // ============================================================
    describe('addSecurityHeaders', () => {
        it('should add Content-Security-Policy header', () => {
            const response = new Response('test');
            const securedResponse = addSecurityHeaders(response);
            expect(securedResponse.headers.get('Content-Security-Policy')).toBeTruthy();
        });

        it('should add HSTS header', () => {
            const response = new Response('test');
            const securedResponse = addSecurityHeaders(response);
            expect(securedResponse.headers.get('Strict-Transport-Security')).toBe(
                'max-age=31536000; includeSubDomains; preload'
            );
        });

        it('should add X-Content-Type-Options header', () => {
            const response = new Response('test');
            const securedResponse = addSecurityHeaders(response);
            expect(securedResponse.headers.get('X-Content-Type-Options')).toBe('nosniff');
        });

        it('should add X-Frame-Options header', () => {
            const response = new Response('test');
            const securedResponse = addSecurityHeaders(response);
            expect(securedResponse.headers.get('X-Frame-Options')).toBe('SAMEORIGIN');
        });

        it('should add X-XSS-Protection header', () => {
            const response = new Response('test');
            const securedResponse = addSecurityHeaders(response);
            expect(securedResponse.headers.get('X-XSS-Protection')).toBe('1; mode=block');
        });

        it('should preserve original response status', () => {
            const response = new Response('test', { status: 201 });
            const securedResponse = addSecurityHeaders(response);
            expect(securedResponse.status).toBe(201);
        });

        it('should use custom config when provided', () => {
            const response = new Response('test');
            const securedResponse = addSecurityHeaders(response, {
                xFrameOptions: 'DENY',
            });
            expect(securedResponse.headers.get('X-Frame-Options')).toBe('DENY');
        });
    });

    // ============================================================
    // CSRF Validation Tests
    // ============================================================
    describe('validateCsrfToken', () => {

        it('should validate matching tokens', () => {
            const token = 'a'.repeat(64);
            const request = new Request('http://test.com', {
                headers: { 'X-CSRF-Token': token },
            });
            expect(validateCsrfToken(request, token)).toBe(true);
        });

        it('should reject mismatched tokens', () => {
            const token = 'a'.repeat(64);
            const request = new Request('http://test.com', {
                headers: { 'X-CSRF-Token': 'b'.repeat(64) },
            });
            expect(validateCsrfToken(request, token)).toBe(false);
        });

        it('should reject different length tokens', () => {
            const token = 'a'.repeat(64);
            const request = new Request('http://test.com', {
                headers: { 'X-CSRF-Token': 'a'.repeat(63) },
            });
            expect(validateCsrfToken(request, token)).toBe(false);
        });

        it('should check query params if header missing', () => {
            const token = 'a'.repeat(64);
            const request = new Request(`http://test.com?_csrf=${token}`);
            expect(validateCsrfToken(request, token)).toBe(true);
        });

        it('should reject if no token provided', () => {
            const token = 'a'.repeat(64);
            const request = new Request('http://test.com');
            expect(validateCsrfToken(request, token)).toBe(false);
        });
    });

    // ============================================================
    // CSRF Middleware Tests
    // ============================================================
    describe('csrfMiddleware', () => {

        it('should skip safe methods', async () => {
            const request = new Request('http://test.com', { method: 'GET' });
            const result = await csrfMiddleware(request, async () => 'token');
            expect(result).toBeNull();
        });

        it('should return 403 if no stored token', async () => {
            const request = new Request('http://test.com', { method: 'POST' });
            const result = await csrfMiddleware(request, async () => null);

            expect(result).not.toBeNull();
            if (result) {
                expect(result.status).toBe(403);
                const body = await result.json();
                expect(body.error.message).toContain('CSRF token bulunamadı');
            }
        });

        it('should return 403 if token mismatch', async () => {
            const request = new Request('http://test.com', {
                method: 'POST',
                headers: { 'X-CSRF-Token': 'wrong' }
            });
            const result = await csrfMiddleware(request, async () => 'correct');

            expect(result).not.toBeNull();
            if (result) {
                expect(result.status).toBe(403);
                const body = await result.json();
                expect(body.error.message).toContain('Geçersiz CSRF token');
            }
        });

        it('should return null (pass) if token matches', async () => {
            const token = 'a'.repeat(64);
            const request = new Request('http://test.com', {
                method: 'POST',
                headers: { 'X-CSRF-Token': token }
            });
            const result = await csrfMiddleware(request, async () => token);

            expect(result).toBeNull();
        });
    });

    // ============================================================
    // JSON Parsing Tests
    // ============================================================
    describe('parseJsonBody', () => {

        it('should parse valid JSON', async () => {
            const data = { foo: 'bar' };
            const request = new Request('http://test.com', {
                method: 'POST',
                body: JSON.stringify(data),
            });

            const result = await parseJsonBody(request);
            expect(result.data).toEqual(data);
        });

        it('should reject invalid JSON', async () => {
            const request = new Request('http://test.com', {
                method: 'POST',
                body: '{ invalid json }',
            });

            const result = await parseJsonBody(request);
            expect(result.error).toContain('Invalid JSON');
        });

        it('should reject if content-length exceeds limit', async () => {
            const request = new Request('http://test.com', {
                method: 'POST',
                body: JSON.stringify({ too: 'large' }),
                headers: { 'content-length': '999999999' },
            });

            const result = await parseJsonBody(request, 100);
            expect(result.error).toContain('Request body too large');
        });

        it('should reject if actual body size exceeds limit', async () => {
            const data = { foo: 'a'.repeat(200) };
            const request = new Request('http://test.com', {
                method: 'POST',
                body: JSON.stringify(data),
            });

            const result = await parseJsonBody(request, 50);
            expect(result.error).toContain('Request body too large');
        });

        it('should sanitize input data', async () => {
            const data = { foo: '<script>alert(1)</script>' };
            const request = new Request('http://test.com', {
                method: 'POST',
                body: JSON.stringify(data),
            });

            const result = await parseJsonBody(request);
            expect((result.data as Record<string, string>).foo).not.toContain('<script>');
        });
    });
});
