
const { createStrapi } = require('@strapi/strapi');

async function fixProvider() {
    const app = await createStrapi({ distDir: './dist' }).load();
    try {
        const user = await strapi.db.query('plugin::users-permissions.user').findOne({
            where: { username: 'halilcetinkaya' }
        });

        if (user) {
            console.log(`Updating user ${user.username} provider from ${user.provider} to local`);
            await strapi.entityService.update('plugin::users-permissions.user', user.id, {
                data: { provider: 'local' }
            });
            console.log('Update Complete');
        } else {
            console.log('User not found');
        }
    } catch (error) {
        console.error(error);
    } finally {
        app.destroy();
    }
}

fixProvider();
