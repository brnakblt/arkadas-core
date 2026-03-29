'use strict';

const NextcloudService = require('../../../../utils/nextcloud');
const nextcloud = new NextcloudService();

module.exports = {
    async afterCreate(event) {
        const { result } = event;
        if (result.tcIdentity) {
            try {
                await nextcloud.ensureGroup('students');
                await nextcloud.syncUser({
                    username: result.tcIdentity,
                    password: result.tcIdentity,
                    email: result.studentNumber ? `${result.studentNumber}@arkadas.com.tr` : undefined
                });
                await nextcloud.addUserToGroup(result.tcIdentity, 'students');
            } catch (e) {
                strapi.log.error(`Nextcloud Sync Error (Student Create): ${e.message}`);
            }
        }
    },

    async afterUpdate(event) {
        const { result } = event;
        if (result.tcIdentity) {
            try {
                await nextcloud.syncUser({
                    username: result.tcIdentity,
                    email: result.studentNumber ? `${result.studentNumber}@arkadas.com.tr` : undefined
                });
            } catch (e) {
                strapi.log.error(`Nextcloud Sync Error (Student Update): ${e.message}`);
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
                strapi.log.error(`Nextcloud Sync Error (Student Delete): ${e.message}`);
            }
        }
    },
};
