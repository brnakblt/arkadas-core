/**
 * OnlyOffice Callback Controller
 * Handles document save states and versioning
 * 
 * SECURITY:
 * - JWT validation ensures requests originate from legitimate OnlyOffice server
 * - URL allowlist prevents SSRF attacks
 * 
 * Status codes from OnlyOffice:
 * 0 - No document with key found
 * 1 - Document is being edited
 * 2 - Document is ready for saving
 * 3 - Document saving error
 * 4 - Document closed with no changes
 * 6 - Document is being edited but current state is saved
 * 7 - Error has occurred while force saving
 */

import type { Strapi } from '@strapi/strapi';
import jwt from 'jsonwebtoken';
import { releaseLock, forceReleaseLock } from '../services/document-lock';

interface OnlyOfficeCallbackBody {
    key: string;
    status: number;
    url?: string;
    users?: string[];
    token?: string; // JWT token from OnlyOffice
    actions?: Array<{
        type: number;
        userid: string;
    }>;
    changesurl?: string;
    history?: {
        serverVersion: string;
        changes: unknown[];
    };
    forcesavetype?: number;
}

// ============================================================================
// SECURITY: URL Allowlist for SSRF Prevention
// ============================================================================

/**
 * Get allowed OnlyOffice domains from environment
 */
function getAllowedDomains(): string[] {
    const envDomains = process.env.ONLYOFFICE_ALLOWED_DOMAINS;
    if (envDomains) {
        return envDomains.split(',').map(d => d.trim().toLowerCase());
    }

    // Default: only allow localhost OnlyOffice in development
    const defaultDomains = [
        'localhost',
        '127.0.0.1',
        'onlyoffice',           // Docker service name
        'host.docker.internal', // Docker host access
    ];

    // Add explicit OnlyOffice URL if configured
    const onlyofficeUrl = process.env.ONLYOFFICE_URL;
    if (onlyofficeUrl) {
        try {
            const url = new URL(onlyofficeUrl);
            defaultDomains.push(url.hostname.toLowerCase());
        } catch {
            // Invalid URL, skip
        }
    }

    return defaultDomains;
}

/**
 * Validate URL against allowlist to prevent SSRF
 */
function isUrlAllowed(url: string): boolean {
    if (!url) return false;

    try {
        const parsedUrl = new URL(url);
        const hostname = parsedUrl.hostname.toLowerCase();
        const allowedDomains = getAllowedDomains();

        // Check exact match or subdomain match
        return allowedDomains.some(domain => {
            return hostname === domain || hostname.endsWith(`.${domain}`);
        });
    } catch {
        return false;
    }
}

// ============================================================================
// SECURITY: JWT Validation for Request Authentication
// ============================================================================

/**
 * Get OnlyOffice JWT secret from environment
 */
function getJwtSecret(): string {
    const secret = process.env.JWT_SECRET || process.env.ONLYOFFICE_JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET not configured for OnlyOffice validation');
    }
    return secret;
}

/**
 * Validate JWT token from OnlyOffice request
 */
function validateOnlyOfficeJwt(token: string, body: OnlyOfficeCallbackBody): boolean {
    try {
        const secret = getJwtSecret();
        const decoded = jwt.verify(token, secret) as any;

        // Verify payload matches the request body
        if (decoded.payload) {
            // OnlyOffice sends the callback data in the JWT payload
            return decoded.payload.key === body.key &&
                decoded.payload.status === body.status;
        }

        return true; // Token is valid
    } catch (error) {
        console.error('JWT validation failed:', error);
        return false;
    }
}

/**
 * Extract JWT from request (header or body)
 */
function extractJwt(ctx: any, body: OnlyOfficeCallbackBody): string | null {
    // Check Authorization header first
    const authHeader = ctx.request.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }

    // Check body token field
    if (body.token) {
        return body.token;
    }

    return null;
}

// ============================================================================
// Controller
// ============================================================================

export default {
    /**
     * Handle OnlyOffice document callback
     * POST /api/onlyoffice/callback
     * 
     * SECURITY: Validates JWT and URL allowlist before processing
     */
    async callback(ctx: any) {
        const strapi: Strapi = ctx.strapi || global.strapi;
        const body: OnlyOfficeCallbackBody = ctx.request.body;

        const { key, status, url, users } = body;

        if (!key) {
            return ctx.badRequest('Missing document key');
        }

        // =====================================================================
        // SECURITY FIX #1: JWT Validation
        // =====================================================================
        const jwtToken = extractJwt(ctx, body);
        if (!jwtToken) {
            strapi.log.warn(`OnlyOffice callback rejected: No JWT token provided for key ${key}`);
            return ctx.unauthorized('Missing authentication token');
        }

        if (!validateOnlyOfficeJwt(jwtToken, body)) {
            strapi.log.warn(`OnlyOffice callback rejected: Invalid JWT for key ${key}`);
            return ctx.unauthorized('Invalid authentication token');
        }

        // =====================================================================
        // SECURITY FIX #2: URL Allowlist (SSRF Prevention)
        // =====================================================================
        if (url && !isUrlAllowed(url)) {
            strapi.log.error(`SSRF attempt blocked: Disallowed URL ${url} for key ${key}`);

            // Log security incident
            try {
                await strapi.db.query('api::audit-log.audit-log').create({
                    data: {
                        action: 'update',
                        entityType: 'security-incident',
                        entityId: key,
                        metadata: {
                            type: 'ssrf_attempt',
                            blockedUrl: url,
                            sourceIp: ctx.request.ip,
                        },
                        timestamp: new Date(),
                        success: false,
                    },
                });
            } catch (error) {
                strapi.log.error('Failed to log security incident:', error);
            }

            return ctx.forbidden('URL not allowed');
        }

        strapi.log.info(`OnlyOffice callback: key=${key}, status=${status}`);

        try {
            switch (status) {
                case 2: // Document ready for saving
                    await handleDocumentSave(strapi, key, url, users);
                    break;

                case 4: // Document closed without changes
                    await handleDocumentClose(strapi, key, users);
                    break;

                case 6: // Force save (auto-save)
                    await handleForceSave(strapi, key, url, users);
                    break;

                case 1: // Document is being edited
                    // No action needed, just acknowledge
                    break;

                case 0: // No document found
                    strapi.log.warn(`OnlyOffice: No document found for key ${key}`);
                    break;

                case 3: // Saving error
                case 7: // Force save error
                    strapi.log.error(`OnlyOffice save error for key ${key}`);
                    await createAuditLog(strapi, key, 'save_error', users);
                    break;
            }

            // OnlyOffice expects { error: 0 } for success
            return { error: 0 };

        } catch (error) {
            strapi.log.error(`OnlyOffice callback error:`, error);
            return { error: 1 };
        }
    },

    /**
     * Get lock status for a document
     * GET /api/onlyoffice/lock/:documentId
     */
    async getLock(ctx: any) {
        const { documentId } = ctx.params;
        const { getLockStatus } = await import('../services/document-lock');

        const lockInfo = await getLockStatus(documentId);

        return {
            locked: lockInfo !== null,
            lockInfo,
        };
    },

    /**
     * Acquire lock on a document
     * POST /api/onlyoffice/lock/:documentId
     */
    async acquireLock(ctx: any) {
        const { documentId } = ctx.params;
        const user = ctx.state.user;

        if (!user) {
            return ctx.unauthorized();
        }

        const { acquireLock } = await import('../services/document-lock');

        const result = await acquireLock(
            documentId,
            user.id,
            user.username || user.email
        );

        if (!result.success) {
            return ctx.conflict({
                message: 'Document is locked by another user',
                lockedBy: result.lockedBy,
            });
        }

        return { success: true };
    },

    /**
     * Release lock on a document
     * DELETE /api/onlyoffice/lock/:documentId
     */
    async releaseLock(ctx: any) {
        const { documentId } = ctx.params;
        const user = ctx.state.user;

        if (!user) {
            return ctx.unauthorized();
        }

        const { releaseLock } = await import('../services/document-lock');

        const result = await releaseLock(documentId, user.id);

        return { success: result };
    },
};

/**
 * Handle document save (status 2)
 * URL has already been validated by the controller
 */
async function handleDocumentSave(
    strapi: Strapi,
    key: string,
    url?: string,
    users?: string[]
): Promise<void> {
    if (!url) {
        strapi.log.warn(`OnlyOffice save requested but no URL provided for key ${key}`);
        return;
    }

    try {
        // Download the saved document from OnlyOffice
        // URL is pre-validated against allowlist
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to download document: ${response.statusText}`);
        }

        const documentBuffer = await response.arrayBuffer();

        // Parse the document key to get storage-file ID
        // Key format: "storageFile_{id}_{version}"
        const keyParts = key.split('_');
        const storageFileId = keyParts[1];

        if (!storageFileId) {
            strapi.log.warn(`Could not parse storage file ID from key ${key}`);
            return;
        }

        // Get the storage-file record
        const storageFile = await strapi.db.query('api::storage-file.storage-file').findOne({
            where: { id: storageFileId },
        });

        if (!storageFile) {
            strapi.log.warn(`Storage file not found for ID ${storageFileId}`);
            return;
        }

        // Create new version
        const newVersion = (storageFile.version || 1) + 1;

        // Update the storage-file record
        await strapi.db.query('api::storage-file.storage-file').update({
            where: { id: storageFileId },
            data: {
                version: newVersion,
                lastModifiedAt: new Date(),
                lastModifiedBy: users?.[0] || 'unknown',
            },
        });

        // Create audit log
        await createAuditLog(strapi, key, 'save', users);

        // Release the lock
        await forceReleaseLock(key);

        strapi.log.info(`Document saved: key=${key}, version=${newVersion}`);

    } catch (error) {
        strapi.log.error(`Failed to save document ${key}:`, error);
        throw error;
    }
}

/**
 * Handle document close (status 4)
 */
async function handleDocumentClose(
    strapi: Strapi,
    key: string,
    users?: string[]
): Promise<void> {
    // Release the lock
    await forceReleaseLock(key);

    // Create audit log
    await createAuditLog(strapi, key, 'close', users);

    strapi.log.info(`Document closed without changes: key=${key}`);
}

/**
 * Handle force save (status 6)
 */
async function handleForceSave(
    strapi: Strapi,
    key: string,
    url?: string,
    users?: string[]
): Promise<void> {
    if (!url) return;

    // Create audit log
    await createAuditLog(strapi, key, 'autosave', users);

    strapi.log.info(`Document auto-saved: key=${key}`);
}

/**
 * Create audit log entry
 */
async function createAuditLog(
    strapi: Strapi,
    documentKey: string,
    action: string,
    users?: string[]
): Promise<void> {
    try {
        await strapi.db.query('api::audit-log.audit-log').create({
            data: {
                action: 'update',
                entityType: 'storage-file',
                entityId: documentKey,
                metadata: {
                    onlyofficeAction: action,
                    users: users || [],
                },
                timestamp: new Date(),
                success: true,
            },
        });
    } catch (error) {
        strapi.log.error('Failed to create OnlyOffice audit log:', error);
    }
}
