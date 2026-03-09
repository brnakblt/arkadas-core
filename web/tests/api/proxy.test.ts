/**
 * Proxy Path Security Tests
 *
 * Validates the whitelist/blacklist filtering on the API proxy route.
 * The proxy must only forward requests to allowed Strapi API paths
 * and block all internal/management endpoints.
 */

import { describe, it, expect } from 'vitest';

// Import the path-checking logic from the security module
import { isPathAllowed } from '@/lib/proxy-security';

describe('API Proxy Path Security', () => {
    // ============================================================
    // Whitelist: Only api/ prefixed paths are allowed
    // ============================================================
    describe('Whitelist (allowed paths)', () => {
        it('should allow api/students', () => {
            expect(isPathAllowed('api/students')).toBe(true);
        });

        it('should allow api/student-profiles?populate=*', () => {
            expect(isPathAllowed('api/student-profiles')).toBe(true);
        });

        it('should allow api/articles', () => {
            expect(isPathAllowed('api/articles')).toBe(true);
        });

        it('should allow api/schedules', () => {
            expect(isPathAllowed('api/schedules')).toBe(true);
        });

        it('should allow api/auth/local', () => {
            expect(isPathAllowed('api/auth/local')).toBe(true);
        });

        it('should allow api/faqs', () => {
            expect(isPathAllowed('api/faqs')).toBe(true);
        });
    });

    // ============================================================
    // Blacklist: Blocked management/internal endpoints
    // ============================================================
    describe('Blacklist (blocked paths)', () => {
        it('should block admin paths', () => {
            expect(isPathAllowed('admin')).toBe(false);
            expect(isPathAllowed('admin/users')).toBe(false);
            expect(isPathAllowed('api/admin/settings')).toBe(false);
        });

        it('should block _health endpoint', () => {
            expect(isPathAllowed('_health')).toBe(false);
            expect(isPathAllowed('api/_health')).toBe(false);
        });

        it('should block users-permissions', () => {
            expect(isPathAllowed('api/users-permissions/roles')).toBe(false);
            expect(isPathAllowed('users-permissions')).toBe(false);
        });

        it('should block upload endpoints', () => {
            expect(isPathAllowed('api/upload')).toBe(false);
            expect(isPathAllowed('upload/files')).toBe(false);
        });

        it('should block content-manager', () => {
            expect(isPathAllowed('api/content-manager/collection-types')).toBe(false);
            expect(isPathAllowed('content-manager')).toBe(false);
        });

        it('should block content-type-builder', () => {
            expect(isPathAllowed('api/content-type-builder/content-types')).toBe(false);
        });
    });

    // ============================================================
    // Edge cases
    // ============================================================
    describe('Edge cases', () => {
        it('should block paths not starting with api/', () => {
            expect(isPathAllowed('strapi/admin')).toBe(false);
            expect(isPathAllowed('internal/debug')).toBe(false);
            expect(isPathAllowed('')).toBe(false);
        });

        it('should be case-insensitive', () => {
            expect(isPathAllowed('API/students')).toBe(true);
            expect(isPathAllowed('api/ADMIN')).toBe(false);
            expect(isPathAllowed('ADMIN')).toBe(false);
            expect(isPathAllowed('Api/Content-Manager')).toBe(false);
        });

        it('should block path traversal attempts', () => {
            expect(isPathAllowed('../admin')).toBe(false);
            expect(isPathAllowed('api/../admin')).toBe(false);
        });
    });
});
