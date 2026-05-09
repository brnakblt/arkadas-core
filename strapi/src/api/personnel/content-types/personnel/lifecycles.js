'use strict';

const NextcloudService = require('../../../../utils/nextcloud');
const nextcloud = new NextcloudService();

module.exports = {
    async afterCreate(event) {
        const { result } = event;
        if (result.tcIdentity) {
            try {
                await nextcloud.ensureGroup('teachers');
                await nextcloud.syncUser({
                    username: result.tcIdentity, // Using TCKN as username
                    password: result.tcIdentity,
                    email: result.email,
                });
                await nextcloud.addUserToGroup(result.tcIdentity, 'teachers');
            } catch (e) {
                strapi.log.error(`Nextcloud Sync Error (Personnel Create): ${e.message}`);
            }
        }
    },

    async afterUpdate(event) {
        const { result } = event;
        if (result.tcIdentity) {
            try {
                await nextcloud.syncUser({
                    username: result.tcIdentity,
                    email: result.email,
                });
                await nextcloud.addUserToGroup(result.tcIdentity, 'teachers');
            } catch (e) {
                strapi.log.error(`Nextcloud Sync Error (Personnel Update): ${e.message}`);
            }
        }
    },

    async afterDelete(event) {
        const { result } = event;
        if (result.tcIdentity) {
            try {
                await nextcloud.syncUser({
                    username: result.tcIdentity,
                    deleteUser: true
                });
            } catch (e) {
                strapi.log.error(`Nextcloud Sync Error (Personnel Delete): ${e.message}`);
            }
        }
    },
};
