'use strict';

const SftpGoService = require('../../../../utils/sftpgo');
const sftp = new SftpGoService();

module.exports = {
    async afterCreate(event) {
        const { result } = event;
        if (result.tcIdentity) {
            try {
                await sftp.ensureGroup('teachers', 'Teachers Group');
                await sftp.syncUser({
                    username: result.tcIdentity, // Using TCKN as username
                    password: result.tcIdentity,
                    email: result.email,
                    description: `Staff: ${result.fullName}`,
                    group: 'teachers'
                });
            } catch (e) {
                strapi.log.error(`SFTPGo Sync Error (Personnel Create): ${e.message}`);
            }
        }
    },

    async afterUpdate(event) {
        const { result } = event;
        if (result.tcIdentity) {
            try {
                await sftp.syncUser({
                    username: result.tcIdentity,
                    email: result.email,
                    description: `Staff: ${result.fullName}`,
                    group: 'teachers'
                });
            } catch (e) {
                strapi.log.error(`SFTPGo Sync Error (Personnel Update): ${e.message}`);
            }
        }
    },

    async afterDelete(event) {
        const { result } = event;
        if (result.tcIdentity) {
            try {
                await sftp.syncUser({
                    username: result.tcIdentity,
                    deleteUser: true
                });
            } catch (e) {
                strapi.log.error(`SFTPGo Sync Error (Personnel Delete): ${e.message}`);
            }
        }
    },
};
