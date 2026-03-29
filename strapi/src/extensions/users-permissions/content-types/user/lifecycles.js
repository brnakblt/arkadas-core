const NextcloudService = require('../../../../utils/nextcloud');
const nextcloud = new NextcloudService();

/**
 * User Lifecycle Hooks
 * Provisions storage for new users via Nextcloud
 */
module.exports = {
    async afterCreate(event) {
        const { result } = event;
        try {
            console.log(`[Storage] New user created: ${result.username} (${result.email}). Provisioning storage...`);
            await nextcloud.syncUser({
                username: result.username,
                email: result.email
            });
            console.log(`[Storage] User ${result.username} provisioned successfully.`);
        } catch (err) {
            console.error('[Storage] Failed to provision user:', err);
        }
    },

    async afterUpdate(event) {
        const { result, params } = event;
        try {
            // If blocked status changed, update storage access
            if (params.data.blocked !== undefined) {
                if (result.blocked) {
                    await nextcloud.syncUser({ username: result.username, deleteUser: true }); // Or implement disable
                } else {
                    await nextcloud.syncUser({ username: result.username });
                }
            }
        } catch (err) {
            console.error('[Storage] Failed to update user status:', err);
        }
    }
};
