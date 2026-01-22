'use strict';

const sftpGoService = require('../../../../../utils/sftpgo');

module.exports = {
    async afterCreate(event) {
        const { result } = event;
        if (result.tcIdentity) {
            await sftpGoService.ensureGroup('students', 'Students Group');
            await sftpGoService.syncUser({
                username: result.tcIdentity, // or use studentNumber if present? sticking to TCKN or derived username. 
                // Wait, seed uses TCKN as password, but what is the username?
                // Seed uses `generateUsername` (name+surname). But Admin Panel creates structured data.
                // Let's use tcIdentity as username for consistency if possible, or normalize name?
                // To keep it simple and safe for uniqueness: TCKN is best for username in automated systems.
                // BUT seed uses normalized name.
                // Let's use normalized name logic if possible, or fallback to TCKN?
                // Standardizing on TCKN as username in SFTPGo might be safer for non-seed creation.
                // Let's stick to TCKN for now for Lifecycle-created users to ensure uniqueness.
                username: result.tcIdentity, // Using TCKN as username for reliability
                password: result.tcIdentity, // Initial password
                email: result.studentNumber ? `${result.studentNumber}@arkadas.com.tr` : undefined,
                description: `Student: ${result.fullName}`,
                group: 'students'
            });
        }
    },

    async afterUpdate(event) {
        const { result } = event;
        if (result.tcIdentity) {
            // We don't change password on update to avoid locking user out if they changed it.
            await sftpGoService.syncUser({
                username: result.tcIdentity,
                email: result.studentNumber ? `${result.studentNumber}@arkadas.com.tr` : undefined,
                description: `Student: ${result.fullName}`,
                group: 'students'
            });
        }
    },

    async afterDelete(event) {
        const { result } = event;
        if (result.tcIdentity) {
            await sftpGoService.syncUser({
                username: result.tcIdentity,
                deleteUser: true
            });
        }
    },
};
