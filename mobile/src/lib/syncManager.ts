/**
 * Sync Manager
 * Handles background sync of offline data when connectivity is restored
 */

import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { offlineStorage } from './offlineStorage';
import { api } from './api';

class SyncManager {
    private isSyncing = false;
    private unsubscribeNetInfo: (() => void) | null = null;

    /**
     * Start listening for network changes
     */
    startListening(): void {
        if (this.unsubscribeNetInfo) return;

        this.unsubscribeNetInfo = NetInfo.addEventListener((state) => {
            this.handleConnectivityChange(state);
        });
    }

    /**
     * Stop listening for network changes
     */
    stopListening(): void {
        if (this.unsubscribeNetInfo) {
            this.unsubscribeNetInfo();
            this.unsubscribeNetInfo = null;
        }
    }

    /**
     * Handle connectivity changes
     */
    private async handleConnectivityChange(state: NetInfoState): Promise<void> {
        if (state.isConnected && state.isInternetReachable) {
            console.log('[Sync] Network connected, starting sync...');
            await this.syncAll();
        }
    }

    /**
     * Sync all pending data
     */
    async syncAll(): Promise<{ success: number; failed: number }> {
        if (this.isSyncing) {
            console.log('[Sync] Already syncing, skipping...');
            return { success: 0, failed: 0 };
        }

        this.isSyncing = true;
        let success = 0;
        let failed = 0;

        try {
            // Get pending sync items
            const queue = await offlineStorage.getSyncQueue();
            console.log(`[Sync] Processing ${queue.length} items...`);

            for (const item of queue) {
                try {
                    await this.processQueueItem(item);
                    await offlineStorage.removeSyncItem(item.id);
                    success++;
                } catch (error) {
                    console.error(`[Sync] Failed to sync item ${item.id}:`, error);
                    await offlineStorage.incrementSyncAttempt(item.id);
                    failed++;
                }
            }

            // Sync unsynced attendance records
            const unsyncedAttendance = await offlineStorage.getUnsyncedAttendance();
            for (const record of unsyncedAttendance) {
                try {
                    await api.fetch('/api/attendance-logs', {
                        method: 'POST',
                        body: JSON.stringify({
                            data: {
                                student: record.studentId,
                                checkInTime: record.checkInTime,
                                status: record.status,
                                verificationMethod: 'face_recognition',
                                confidenceScore: record.confidenceScore,
                                date: record.checkInTime.split('T')[0],
                                offlineId: record.id, // For deduplication
                            },
                        }),
                    });
                    await offlineStorage.markAsSynced(record.id);
                    success++;
                } catch (error) {
                    console.error(`[Sync] Failed to sync attendance ${record.id}:`, error);
                    failed++;
                }
            }

            console.log(`[Sync] Complete: ${success} success, ${failed} failed`);
        } finally {
            this.isSyncing = false;
        }

        return { success, failed };
    }

    /**
     * Process a single queue item
     */
    private async processQueueItem(item: { type: string; payload: unknown }): Promise<void> {
        switch (item.type) {
            case 'attendance':
                await this.syncAttendance(item.payload as {
                    studentId: number;
                    checkInTime: string;
                    status: string;
                    confidenceScore?: number;
                });
                break;

            case 'message':
                await this.syncMessage(item.payload as {
                    recipientId: number;
                    content: string;
                });
                break;

            default:
                console.warn(`[Sync] Unknown sync type: ${item.type}`);
        }
    }

    /**
     * Sync attendance record
     */
    private async syncAttendance(payload: {
        studentId: number;
        checkInTime: string;
        status: string;
        confidenceScore?: number;
    }): Promise<void> {
        await api.fetch('/api/attendance-logs', {
            method: 'POST',
            body: JSON.stringify({
                data: {
                    student: payload.studentId,
                    checkInTime: payload.checkInTime,
                    status: payload.status,
                    verificationMethod: 'face_recognition',
                    confidenceScore: payload.confidenceScore,
                    date: payload.checkInTime.split('T')[0],
                },
            }),
        });
    }

    /**
     * Sync message
     */
    private async syncMessage(payload: {
        recipientId: number;
        content: string;
    }): Promise<void> {
        await api.fetch('/api/messages', {
            method: 'POST',
            body: JSON.stringify({
                data: {
                    recipient: payload.recipientId,
                    content: payload.content,
                    sentAt: new Date().toISOString(),
                },
            }),
        });
    }

    /**
     * Check if currently syncing
     */
    isSyncInProgress(): boolean {
        return this.isSyncing;
    }

    /**
     * Get sync status
     */
    async getStatus(): Promise<{
        pendingCount: number;
        lastSync?: string;
        isOnline: boolean;
    }> {
        const queue = await offlineStorage.getSyncQueue();
        const netInfo = await NetInfo.fetch();

        return {
            pendingCount: queue.length,
            isOnline: netInfo.isConnected === true && netInfo.isInternetReachable === true,
        };
    }
}

export const syncManager = new SyncManager();
