/**
 * Student Profile Lifecycle Hooks
 * Handles PII encryption for TCKN and sensitive health data
 */

import { encrypt, decrypt, isEncrypted } from '../../../../utils/encryption';

// Fields that should be encrypted
const ENCRYPTED_FIELDS = ['tckimlikno', 'disabilityType'];

export default {
    /**
     * Encrypt sensitive fields before creating a new record
     */
    async beforeCreate(event: any) {
        const { data } = event.params;

        for (const field of ENCRYPTED_FIELDS) {
            if (data[field] && !isEncrypted(data[field])) {
                data[field] = encrypt(data[field]);
            }
        }
    },

    /**
     * Encrypt sensitive fields before updating a record
     */
    async beforeUpdate(event: any) {
        const { data } = event.params;

        for (const field of ENCRYPTED_FIELDS) {
            if (data[field] !== undefined && data[field] && !isEncrypted(data[field])) {
                data[field] = encrypt(data[field]);
            }
        }
    },

    /**
     * Decrypt sensitive fields after fetching a single record
     * Only decrypt if user has appropriate permissions
     */
    async afterFindOne(event: any) {
        const { result } = event;

        if (!result) return;

        // Check if we should decrypt (based on context)
        // For now, always decrypt for authorized users
        // Row-level security is handled by the parent-owns-student policy
        for (const field of ENCRYPTED_FIELDS) {
            if (result[field] && isEncrypted(result[field])) {
                try {
                    result[field] = decrypt(result[field]);
                } catch (error) {
                    console.error(`Failed to decrypt ${field}:`, error);
                }
            }
        }
    },

    /**
     * Decrypt sensitive fields after fetching multiple records
     */
    async afterFindMany(event: any) {
        const { result } = event;

        if (!result || !Array.isArray(result)) return;

        for (const record of result) {
            for (const field of ENCRYPTED_FIELDS) {
                if (record[field] && isEncrypted(record[field])) {
                    try {
                        record[field] = decrypt(record[field]);
                    } catch (error) {
                        console.error(`Failed to decrypt ${field}:`, error);
                    }
                }
            }
        }
    },
};
