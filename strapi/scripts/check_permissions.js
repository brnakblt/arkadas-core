
const { createStrapi } = require('@strapi/strapi');

async function checkPermissions() {
    const app = await createStrapi({ distDir: './dist' }).load();
    try {
        const role = await strapi.db.query('plugin::users-permissions.role').findOne({
            where: { type: 'authenticated' },
            populate: ['permissions']
        });

        if (!role) {
            console.log('Authenticated Role not found!');
            return;
        }

        console.log(`Role: ${role.name} (${role.type})`);
        const userPermissions = role.permissions.filter(p => p.action.startsWith('plugin::users-permissions.user'));
        console.log('User Permissions:', userPermissions.map(p => p.action));

        const mePermission = userPermissions.find(p => p.action === 'plugin::users-permissions.user.me');
        console.log('Has "me" permission:', !!mePermission);

    } catch (error) {
        console.error(error);
    } finally {
        app.destroy();
    }
}

checkPermissions();
