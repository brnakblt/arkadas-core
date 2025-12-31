/**
 * User Lifecycle Hooks
 * Provisions storage for new users via SFTPGo
 */
module.exports = {
    async afterCreate(event) {
        const { result } = event;
        try {
            // Try to provision SFTPGo user (optional - service may not exist)
            const sftpgoService = strapi.service('api::storage-file.sftpgo');
            if (sftpgoService?.provisionUser) {
                console.log(`[Storage] New user created: ${result.username} (${result.email}). Provisioning storage...`);
                await sftpgoService.provisionUser(result.id, result.username, result.email);
                console.log(`[Storage] User ${result.username} provisioned successfully.`);
            }
        } catch (err) {
            console.error('[Storage] Failed to provision user:', err);
            // We don't throw here to avoid rolling back the user creation
        }
    },

    async afterUpdate(event) {
        const { result, params } = event;
        try {
            // If blocked status changed, update storage access
            const sftpgoService = strapi.service('api::storage-file.sftpgo');
            if (sftpgoService && params.data.blocked !== undefined) {
                if (result.blocked) {
                    await sftpgoService.disableUser?.(result.username);
                } else {
                    await sftpgoService.enableUser?.(result.username);
                }
            }
        } catch (err) {
            console.error('[Storage] Failed to update user status:', err);
        }
    }
};
