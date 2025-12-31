module.exports = {
    async afterCreate(event) {
        const { result } = event;
        try {
            // Only sync if the user is confirmed and not blocked (optional check)
            // or just sync everyone. Let's sync everyone but maybe check provider.

            console.log(`[Nextcloud Sync] New user created: ${result.username} (${result.email}). Provisioning...`);

            await strapi.service('api::nextcloud-sync.nextcloud-sync').provisionUser(result.id);

            console.log(`[Nextcloud Sync] User ${result.username} provisioned successfully.`);
        } catch (err) {
            console.error('[Nextcloud Sync] Failed to provision user:', err);
            // We don't throw here to avoid rolling back the user creation
        }
    },

    async afterUpdate(event) {
        const { result, params } = event;
        try {
            // If blocked status changed
            if (params.data.blocked !== undefined) {
                if (result.blocked) {
                    await strapi.service('api::nextcloud-sync.nextcloud-sync').suspendUser(result.id);
                } else {
                    await strapi.service('api::nextcloud-sync.nextcloud-sync').reactivateUser(result.id);
                }
            }
        } catch (err) {
            console.error('[Nextcloud Sync] Failed to update user status:', err);
        }
    }
};
