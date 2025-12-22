'use strict';

const { createCoreService } = require('@strapi/strapi').factories;
const bcrypt = require('bcryptjs');

module.exports = createCoreService('api::file-share.file-share', {
    async hashPassword(password) {
        return bcrypt.hash(password, 10);
    },

    async verifyPassword(plainPassword, hashedPassword) {
        if (!plainPassword || !hashedPassword) return false;
        return bcrypt.compare(plainPassword, hashedPassword);
    },
});
