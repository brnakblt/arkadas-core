/**
 * A set of functions called "actions" for `setup-auth`
 */

export default ({ strapi }) => ({
    async resetInitialPassword(ctx) {
        try {
            const { username, tckimlikno, newPassword } = ctx.request.body;

            if (!username || !tckimlikno || !newPassword) {
                return ctx.badRequest('Missing username, tckimlikno, or newPassword');
            }

            if (newPassword.length < 6) {
                return ctx.badRequest('Password must be at least 6 characters');
            }

            // 1. Find User (using query engine directly)
            const users = await strapi.db.query('plugin::users-permissions.user').findMany({
                where: { username },
            });

            if (!users || users.length === 0) {
                return ctx.badRequest('User not found');
            }

            const user = users[0];

            // 2. Check if reset is allowed
            if (!user.isPasswordResetRequired) {
                return ctx.badRequest('Initial password reset is either already done or not required.');
            }

            // 3. Verify TCKN
            // Look for linked profiles
            const teacherProfile = await strapi.db.query('api::teacher-profile.teacher-profile').findOne({
                where: { user: user.id },
            });

            const studentProfile = await strapi.db.query('api::student-profile.student-profile').findOne({
                where: { user: user.id },
            });

            let profileTckn = null;

            if (teacherProfile) {
                profileTckn = teacherProfile.tckimlikno;
            } else if (studentProfile) {
                profileTckn = studentProfile.tckimlikno;
            } else {
                return ctx.forbidden('User does not have an associated profile to verify identity.');
            }

            if (!profileTckn) {
                return ctx.forbidden('Profile validation failed (Missing TCKN in record). Contact administrator.');
            }

            if (profileTckn !== tckimlikno) {
                return ctx.forbidden('Identity verification failed.');
            }

            // 4. Update Password
            // We use the auth service (plugin users-permissions) to handle hashing
            await strapi.plugin('users-permissions').service('user').edit(user.id, {
                password: newPassword,
                isPasswordResetRequired: false,
                confirmed: true // Ensure confirmed if not
            });

            // 5. Generate JWT (Auto Login)
            const jwt = strapi.plugin('users-permissions').service('jwt').issue({ id: user.id });

            return ctx.send({
                jwt,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    isPasswordResetRequired: false
                }
            });

        } catch (err) {
            ctx.body = err;
        }
    }
});
