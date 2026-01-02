/**
 * OnlyOffice Callback Controller
 * Handles document save states and versioning
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

import type { Core } from '@strapi/strapi';
import { releaseLock, forceReleaseLock } from '../services/document-lock';

interface OnlyOfficeCallbackBody {
    key: string;
    status: number;
    url?: string;
    users?: string[];
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

export default {
    /**
     * Handle OnlyOffice document callback
     * POST /api/onlyoffice/callback
     */
    async callback(ctx: any) {
        const strapi: Core.Strapi = ctx.strapi || global.strapi;
        const body: OnlyOfficeCallbackBody = ctx.request.body;

        const { key, status, url, users } = body;

        if (!key) {
            return ctx.badRequest('Missing document key');
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
 */
async function handleDocumentSave(
    strapi: Core.Strapi,
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

        // TODO: Actually save the file content to storage (SFTPGo/local)
        // This depends on your storage implementation

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
    strapi: Core.Strapi,
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
    strapi: Core.Strapi,
    key: string,
    url?: string,
    users?: string[]
): Promise<void> {
    // Similar to regular save but don't increment version
    // This is for auto-save functionality

    if (!url) return;

    // Create audit log
    await createAuditLog(strapi, key, 'autosave', users);

    strapi.log.info(`Document auto-saved: key=${key}`);
}

/**
 * Create audit log entry
 */
async function createAuditLog(
    strapi: Core.Strapi,
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
