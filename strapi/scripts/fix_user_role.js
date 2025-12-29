
const { createStrapi } = require('@strapi/strapi');

async function fixRole() {
    const app = await createStrapi({ distDir: './dist' }).load();
    try {
        const authenticatedRole = await strapi.db.query('plugin::users-permissions.role').findOne({
            where: { type: 'authenticated' }
        });

        if (!authenticatedRole) {
            console.log('Authenticated role not found.');
            return;
        }

        const user = await strapi.db.query('plugin::users-permissions.user').findOne({
            where: { username: 'halilcetinkaya' },
            populate: ['role']
        });

        if (user) {
            console.log(`User ${user.username} current role: ${user.role ? user.role.name : 'NONE'}`);

            await strapi.entityService.update('plugin::users-permissions.user', user.id, {
                data: { role: authenticatedRole.id }
            });
            console.log(`Updated user to role: ${authenticatedRole.name}`);
        } else {
            console.log('User not found');
        }
    } catch (error) {
        console.error(error);
    } finally {
        app.destroy();
    }
}

fixRole();
