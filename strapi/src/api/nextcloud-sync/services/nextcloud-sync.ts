/**
 * nextcloud-sync service
 * Extended service for syncing Strapi users with Nextcloud
 */

import { factories } from '@strapi/strapi';
import NextcloudOCSService from '../../../services/nextcloud-ocs';

interface SyncResult {
    success: boolean;
    nextcloudUserId?: string;
    homeFolderPath?: string;
    error?: string;
}

interface SyncRecord {
    id: number;
    nextcloudUserId: string;
    nextcloudDisplayName?: string;
    homeFolderPath?: string;
    quotaUsed?: string;
    quotaTotal?: string;
    syncStatus: 'active' | 'suspended' | 'error';
    lastSyncAt?: Date;
    lastError?: string;
    user?: {
        id: number;
        username: string;
        email: string;
    };
}

export default factories.createCoreService('api::nextcloud-sync.nextcloud-sync', ({ strapi }) => ({
    /**
     * Get or create NextcloudOCSService instance
     */
    getNextcloudService(): NextcloudOCSService {
        return new NextcloudOCSService();
    },

    /**
     * Provision a Strapi user to Nextcloud
     * Creates Nextcloud account, home folder, and sync record
     */
    async provisionUser(strapiUserId: number, options?: {
        groups?: string[];
        quotaBytes?: number;
    }): Promise<SyncResult> {
        const nc = this.getNextcloudService();

        try {
            // Get Strapi user
            const user = await strapi.db.query('plugin::users-permissions.user').findOne({
                where: { id: strapiUserId },
            });

            if (!user) {
                return { success: false, error: 'User not found' };
            }

            // Check if already synced
            const existingSync = await strapi.db.query('api::nextcloud-sync.nextcloud-sync').findOne({
                where: { user: strapiUserId },
            });

            if (existingSync) {
                return {
                    success: true,
                    nextcloudUserId: existingSync.nextcloudUserId,
                    homeFolderPath: existingSync.homeFolderPath,
                };
            }

            // Generate Nextcloud username (use Strapi username or email prefix)
            const ncUsername = user.username || user.email.split('@')[0];

            // Check if user already exists in Nextcloud
            const userExists = await nc.userExists(ncUsername);

            if (!userExists) {
                // Generate a secure password (user will reset via email)
                const tempPassword = this.generateSecurePassword();

                // Create Nextcloud user
                await nc.createUser(
                    ncUsername,
                    tempPassword,
                    user.email,
                    `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username,
                    options?.groups
                );

                // Set quota if specified
                if (options?.quotaBytes) {
                    await nc.setQuota(ncUsername, options.quotaBytes);
                }
            }

            // Create home folder structure
            const homeFolderPath = `Users/${ncUsername}`;
            await nc.createFolder(ncUsername, 'Documents');
            await nc.createFolder(ncUsername, 'Photos');

            // Get user info from Nextcloud
            const ncUser = await nc.getUser(ncUsername);

            // Create sync record in Strapi
            const syncRecord = await strapi.db.query('api::nextcloud-sync.nextcloud-sync').create({
                data: {
                    nextcloudUserId: ncUsername,
                    nextcloudDisplayName: ncUser.displayname || ncUsername,
                    homeFolderPath: homeFolderPath,
                    quotaUsed: ncUser.quota?.used?.toString() || '0',
                    quotaTotal: ncUser.quota?.total?.toString(),
                    syncStatus: 'active',
                    lastSyncAt: new Date(),
                    user: strapiUserId,
                },
            });

            return {
                success: true,
                nextcloudUserId: ncUsername,
                homeFolderPath: homeFolderPath,
            };
        } catch (error: any) {
            strapi.log.error('Nextcloud provisioning failed:', error);

            return {
                success: false,
                error: error.message || 'Unknown error',
            };
        }
    },

    /**
     * Sync user data from Nextcloud to Strapi
     */
    async syncUserData(strapiUserId: number): Promise<SyncResult> {
        const nc = this.getNextcloudService();

        try {
            const syncRecord = await strapi.db.query('api::nextcloud-sync.nextcloud-sync').findOne({
                where: { user: strapiUserId },
            });

            if (!syncRecord) {
                return { success: false, error: 'Sync record not found' };
            }

            // Get fresh data from Nextcloud
            const ncUser = await nc.getUser(syncRecord.nextcloudUserId);

            // Update sync record
            await strapi.db.query('api::nextcloud-sync.nextcloud-sync').update({
                where: { id: syncRecord.id },
                data: {
                    nextcloudDisplayName: ncUser.displayname,
                    quotaUsed: ncUser.quota?.used?.toString() || '0',
                    quotaTotal: ncUser.quota?.total?.toString(),
                    syncStatus: ncUser.enabled ? 'active' : 'suspended',
                    lastSyncAt: new Date(),
                    lastError: null,
                },
            });

            return {
                success: true,
                nextcloudUserId: syncRecord.nextcloudUserId,
            };
        } catch (error: any) {
            // Update sync record with error
            const syncRecord = await strapi.db.query('api::nextcloud-sync.nextcloud-sync').findOne({
                where: { user: strapiUserId },
            });

            if (syncRecord) {
                await strapi.db.query('api::nextcloud-sync.nextcloud-sync').update({
                    where: { id: syncRecord.id },
                    data: {
                        syncStatus: 'error',
                        lastError: error.message,
                    },
                });
            }

            return {
                success: false,
                error: error.message,
            };
        }
    },

    /**
     * Suspend user in Nextcloud
     */
    async suspendUser(strapiUserId: number): Promise<SyncResult> {
        const nc = this.getNextcloudService();

        try {
            const syncRecord = await strapi.db.query('api::nextcloud-sync.nextcloud-sync').findOne({
                where: { user: strapiUserId },
            });

            if (!syncRecord) {
                return { success: false, error: 'Sync record not found' };
            }

            await nc.disableUser(syncRecord.nextcloudUserId);

            await strapi.db.query('api::nextcloud-sync.nextcloud-sync').update({
                where: { id: syncRecord.id },
                data: {
                    syncStatus: 'suspended',
                    lastSyncAt: new Date(),
                },
            });

            return { success: true, nextcloudUserId: syncRecord.nextcloudUserId };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Reactivate user in Nextcloud
     */
    async reactivateUser(strapiUserId: number): Promise<SyncResult> {
        const nc = this.getNextcloudService();

        try {
            const syncRecord = await strapi.db.query('api::nextcloud-sync.nextcloud-sync').findOne({
                where: { user: strapiUserId },
            });

            if (!syncRecord) {
                return { success: false, error: 'Sync record not found' };
            }

            await nc.enableUser(syncRecord.nextcloudUserId);

            await strapi.db.query('api::nextcloud-sync.nextcloud-sync').update({
                where: { id: syncRecord.id },
                data: {
                    syncStatus: 'active',
                    lastSyncAt: new Date(),
                },
            });

            return { success: true, nextcloudUserId: syncRecord.nextcloudUserId };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Get sync status for a user
     */
    async getSyncStatus(strapiUserId: number): Promise<SyncRecord | null> {
        const syncRecord = await strapi.db.query('api::nextcloud-sync.nextcloud-sync').findOne({
            where: { user: strapiUserId },
            populate: ['user'],
        });

        return syncRecord;
    },

    /**
     * Batch provision multiple users
     */
    async batchProvision(strapiUserIds: number[], options?: {
        groups?: string[];
        quotaBytes?: number;
    }): Promise<{ successful: number; failed: number; results: SyncResult[] }> {
        const results: SyncResult[] = [];
        let successful = 0;
        let failed = 0;

        for (const userId of strapiUserIds) {
            const result = await this.provisionUser(userId, options);
            results.push(result);
            if (result.success) {
                successful++;
            } else {
                failed++;
            }
        }

        return { successful, failed, results };
    },

    /**
     * Generate a secure random password
     */
    generateSecurePassword(length: number = 16): string {
        const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
        let password = '';
        const randomBytes = require('crypto').randomBytes(length);
        for (let i = 0; i < length; i++) {
            password += charset[randomBytes[i] % charset.length];
        }
        return password;
    },
}));
