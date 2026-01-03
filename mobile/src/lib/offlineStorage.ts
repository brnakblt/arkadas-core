/**
 * Offline Storage Service
 * SQLite-based local storage for offline-first functionality
 */

import * as SQLite from 'expo-sqlite';

const DB_NAME = 'arkadas_offline.db';

export interface OfflineAttendance {
    id: string;
    studentId: number;
    studentName: string;
    checkInTime: string;
    status: 'present' | 'late';
    confidenceScore?: number;
    synced: boolean;
    createdAt: string;
}

export interface OfflineStudent {
    id: number;
    name: string;
    photo?: string;
    faceEncoding?: string; // Base64 encoded face embedding
    updatedAt: string;
}

class OfflineStorage {
    private db: SQLite.SQLiteDatabase | null = null;

    /**
     * Initialize database and create tables
     */
    async init(): Promise<void> {
        if (this.db) return;

        this.db = await SQLite.openDatabaseAsync(DB_NAME);

        // Create tables
        await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS offline_attendance (
        id TEXT PRIMARY KEY,
        studentId INTEGER NOT NULL,
        studentName TEXT NOT NULL,
        checkInTime TEXT NOT NULL,
        status TEXT NOT NULL,
        confidenceScore REAL,
        synced INTEGER DEFAULT 0,
        createdAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS offline_students (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        photo TEXT,
        faceEncoding TEXT,
        updatedAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sync_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        payload TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        attempts INTEGER DEFAULT 0
      );
    `);
    }

    /**
     * Save attendance record for offline sync
     */
    async saveAttendance(record: Omit<OfflineAttendance, 'id' | 'createdAt' | 'synced'>): Promise<string> {
        await this.init();

        const id = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const createdAt = new Date().toISOString();

        await this.db!.runAsync(
            `INSERT INTO offline_attendance (id, studentId, studentName, checkInTime, status, confidenceScore, synced, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, 0, ?)`,
            [id, record.studentId, record.studentName, record.checkInTime, record.status, record.confidenceScore || null, createdAt]
        );

        // Add to sync queue
        await this.addToSyncQueue('attendance', {
            studentId: record.studentId,
            checkInTime: record.checkInTime,
            status: record.status,
            confidenceScore: record.confidenceScore,
        });

        return id;
    }

    /**
     * Get all unsynced attendance records
     */
    async getUnsyncedAttendance(): Promise<OfflineAttendance[]> {
        await this.init();

        const result = await this.db!.getAllAsync<OfflineAttendance>(
            'SELECT * FROM offline_attendance WHERE synced = 0 ORDER BY createdAt ASC'
        );

        return result;
    }

    /**
     * Mark attendance as synced
     */
    async markAsSynced(id: string): Promise<void> {
        await this.init();
        await this.db!.runAsync('UPDATE offline_attendance SET synced = 1 WHERE id = ?', [id]);
    }

    /**
     * Cache students for offline face recognition
     */
    async cacheStudents(students: OfflineStudent[]): Promise<void> {
        await this.init();

        // Clear existing and insert fresh
        await this.db!.runAsync('DELETE FROM offline_students');

        for (const student of students) {
            await this.db!.runAsync(
                `INSERT INTO offline_students (id, name, photo, faceEncoding, updatedAt)
         VALUES (?, ?, ?, ?, ?)`,
                [student.id, student.name, student.photo || null, student.faceEncoding || null, student.updatedAt]
            );
        }
    }

    /**
     * Get cached students
     */
    async getCachedStudents(): Promise<OfflineStudent[]> {
        await this.init();
        return this.db!.getAllAsync<OfflineStudent>('SELECT * FROM offline_students');
    }

    /**
     * Add item to sync queue
     */
    async addToSyncQueue(type: string, payload: unknown): Promise<void> {
        await this.init();

        await this.db!.runAsync(
            'INSERT INTO sync_queue (type, payload, createdAt) VALUES (?, ?, ?)',
            [type, JSON.stringify(payload), new Date().toISOString()]
        );
    }

    /**
     * Get pending sync items
     */
    async getSyncQueue(): Promise<Array<{ id: number; type: string; payload: unknown; attempts: number }>> {
        await this.init();

        const result = await this.db!.getAllAsync<{ id: number; type: string; payload: string; attempts: number }>(
            'SELECT * FROM sync_queue WHERE attempts < 5 ORDER BY createdAt ASC LIMIT 50'
        );

        return result.map((row) => ({
            id: row.id,
            type: row.type,
            payload: JSON.parse(row.payload),
            attempts: row.attempts,
        }));
    }

    /**
     * Remove synced item from queue
     */
    async removeSyncItem(id: number): Promise<void> {
        await this.init();
        await this.db!.runAsync('DELETE FROM sync_queue WHERE id = ?', [id]);
    }

    /**
     * Increment sync attempt count
     */
    async incrementSyncAttempt(id: number): Promise<void> {
        await this.init();
        await this.db!.runAsync('UPDATE sync_queue SET attempts = attempts + 1 WHERE id = ?', [id]);
    }

    /**
     * Get today's offline attendance count
     */
    async getTodayCount(): Promise<number> {
        await this.init();

        const today = new Date().toISOString().split('T')[0];
        const result = await this.db!.getFirstAsync<{ count: number }>(
            `SELECT COUNT(*) as count FROM offline_attendance WHERE date(createdAt) = ?`,
            [today]
        );

        return result?.count || 0;
    }

    /**
     * Clear old synced data (older than 7 days)
     */
    async cleanup(): Promise<void> {
        await this.init();

        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 7);

        await this.db!.runAsync(
            'DELETE FROM offline_attendance WHERE synced = 1 AND createdAt < ?',
            [cutoff.toISOString()]
        );
    }
}

export const offlineStorage = new OfflineStorage();
