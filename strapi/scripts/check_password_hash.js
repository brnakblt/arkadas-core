
const { createStrapi } = require('@strapi/strapi');

async function checkHash() {
    const app = await createStrapi({ distDir: './dist' }).load();
    try {
        const users = await strapi.db.query('plugin::users-permissions.user').findMany({
            where: { username: 'halilcetinkaya' },
            populate: ['tenant', 'role']
        });
        console.log('Found Users:', users.length);
        const bcrypt = require('bcryptjs');

        for (const u of users) {
            console.log(`User ID: ${u.id}, Email: ${u.email}, Provider: ${u.provider}, Confirmed: ${u.confirmed}, Blocked: ${u.blocked}, Tenant: ${u.tenant?.name}`);
            console.log(`Role: ${u.role ? u.role.name : 'NO ROLE'}`);
            const match = await bcrypt.compare('39148174052', u.password);
            console.log(`   Password Match: ${match}`);
        }
    } catch (error) {
        console.error(error);
    } finally {
        app.destroy();
    }
}

checkHash();
