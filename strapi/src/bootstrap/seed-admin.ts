
export const seedAdmin = async (strapi: any) => {
    const adminEmail = process.env.STRAPI_ADMIN_EMAIL;
    const adminPassword = process.env.STRAPI_ADMIN_PASSWORD;
    const adminFirstname = process.env.STRAPI_ADMIN_FIRSTNAME || 'Super';
    const adminLastname = process.env.STRAPI_ADMIN_LASTNAME || 'Admin';

    if (!adminEmail || !adminPassword) {
        console.warn('STRAPI_ADMIN_EMAIL or STRAPI_ADMIN_PASSWORD not set. Skipping admin seed.');
        return;
    }

    try {
        // 1. Seed Strapi Admin Panel User (Super Admin)
        const adminService = strapi.admin.services.user;
        const existingAdmin = await adminService.findOne({ email: adminEmail });

        if (!existingAdmin) {
            console.log(`Seeding Super Admin (${adminEmail})...`);
            const superAdminRole = await strapi.admin.services.role.findOne({ code: 'strapi-super-admin' });

            if (superAdminRole) {
                const password = await adminService.hashPassword(adminPassword);
                await adminService.create({
                    email: adminEmail,
                    password: password,
                    firstname: adminFirstname,
                    lastname: adminLastname,
                    roles: [superAdminRole.id],
                    isActive: true,
                });
                console.log('Super Admin created.');
            }
        } else {
            console.log('Super Admin already exists.');
        }

        // 2. Seed Frontend User (Authenticated Role)
        // This allows login to the Mobile/Web App with same credentials (if using Strapi Auth)
        const existingUser = await strapi.db.query('plugin::users-permissions.user').findOne({
            where: { email: adminEmail }
        });

        if (!existingUser) {
            console.log(`Seeding Frontend Admin User (${adminEmail})...`);
            const authenticatedRole = await strapi.db.query('plugin::users-permissions.role').findOne({
                where: { type: 'authenticated' }
            });

            if (authenticatedRole) {
                await strapi.plugin('users-permissions').service('user').add({
                    username: adminEmail.split('@')[0], // Use part before @ as username
                    email: adminEmail,
                    password: adminPassword,
                    role: authenticatedRole.id,
                    confirmed: true,
                    blocked: false,
                });
                console.log('Frontend Admin User created.');
            }
        } else {
            console.log('Frontend Admin User already exists.');
        }

    } catch (error) {
        console.error('Error seeding admin:', error);
    }
};
