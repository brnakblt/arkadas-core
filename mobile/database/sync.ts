import { synchronize } from '@nozbe/watermelondb/sync';
import database from './index';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export async function sync() {
    await synchronize({
        database,
        pullChanges: async ({ lastPulledAt, schemaVersion, migration }) => {
            const response = await fetch(`${API_URL}/api/v1/sync/pull?last_pulled_at=${lastPulledAt || 0}&schema_version=${schemaVersion}`, {
                // Add auth headers here
            });
            if (!response.ok) {
                throw new Error('Sync failed');
            }

            const { changes, timestamp } = await response.json();
            return { changes, timestamp };
        },
        pushChanges: async ({ changes, lastPulledAt }) => {
            const response = await fetch(`${API_URL}/api/v1/sync/push?last_pulled_at=${lastPulledAt || 0}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(changes),
            });

            if (!response.ok) {
                throw new Error('Push failed');
            }
        },
        migrationsEnabledAtVersion: 1,
    });
}
