'use strict';

const SftpGoService = require('../../../../utils/sftpgo');
const sftp = new SftpGoService();

module.exports = {
    async afterCreate(event) {
        const { result } = event;
        if (result.tcIdentity) {
            try {
                await sftp.ensureGroup('students', 'Students Group');
                await sftp.syncUser({
                    username: result.tcIdentity,
                    password: result.tcIdentity,
                    email: result.studentNumber ? `${result.studentNumber}@arkadas.com.tr` : undefined,
                    description: `Student: ${result.fullName}`,
                    group: 'students'
                });
            } catch (e) {
                strapi.log.error(`SFTPGo Sync Error (Student Create): ${e.message}`);
            }
        }
    },

    async afterUpdate(event) {
        const { result } = event;
        if (result.tcIdentity) {
            try {
                await sftp.syncUser({
                    username: result.tcIdentity,
                    email: result.studentNumber ? `${result.studentNumber}@arkadas.com.tr` : undefined,
                    description: `Student: ${result.fullName}`,
                    group: 'students'
                });
            } catch (e) {
                strapi.log.error(`SFTPGo Sync Error (Student Update): ${e.message}`);
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
                strapi.log.error(`SFTPGo Sync Error (Student Delete): ${e.message}`);
            }
        }
    },
};
