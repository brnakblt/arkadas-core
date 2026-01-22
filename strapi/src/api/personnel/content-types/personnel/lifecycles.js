'use strict';

const sftpGoService = require('../../../../../utils/sftpgo');

module.exports = {
    async afterCreate(event) {
        const { result } = event;
        if (result.tcIdentity) {
            await sftpGoService.ensureGroup('teachers', 'Teachers Group');
            await sftpGoService.syncUser({
                username: result.tcIdentity, // Using TCKN as username
                password: result.tcIdentity,
                email: result.email,
                description: `Staff: ${result.fullName}`,
                group: 'teachers'
            });
        }
    },

    async afterUpdate(event) {
        const { result } = event;
        if (result.tcIdentity) {
            await sftpGoService.syncUser({
                username: result.tcIdentity,
                email: result.email,
                description: `Staff: ${result.fullName}`,
                group: 'teachers'
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
