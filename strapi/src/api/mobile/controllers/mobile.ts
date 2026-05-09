
/**
 * Mobile API Controller
 * Specialized high-performance endpoints for native apps
 */

export default {
    async dashboard(ctx) {
        const user = ctx.state.user;
        if (!user) return ctx.unauthorized();

        try {
            // 1. Get today's sessions for the user (Teacher or Student)
            const today = new Date().toISOString().split('T')[0];
            const sessions = await strapi.entityService.findMany('api::session-plan.session-plan', {
                filters: {
                    $or: [
                        { teacher: user.id },
                        { student: { parentPhone: user.username } } // Parent access logic
                    ],
                    startTime: { $contains: today },
                    status: { $ne: 'CANCELLED' }
                },
                populate: ['student', 'teacher', 'classroom', 'module']
            });

            // 2. Get active alerts (Mocked for now)
            const alerts = [
                { id: 1, type: 'info', title: 'Yeni Seans', message: 'Yarın saat 10:00\'da yeni seansınız var.' }
            ];

            return {
                success: true,
                data: {
                    user: {
                        fullName: user.fullName,
                        userType: user.userType
                    },
                    sessions,
                    alerts
                }
            };
        } catch (error) {
            return ctx.internalServerError(error.message);
        }
    },

    async studentProfile(ctx) {
        const { id } = ctx.params;
        try {
            const student = await strapi.db.query('api::student.student').findOne({
                where: { id },
                populate: {
                    ramReports: true,
                    bepTargets: {
                        where: { isCompleted: false }
                    },
                    educationalModules: true
                }
            });

            if (!student) return ctx.notFound('Öğrenci bulunamadı');

            return {
                success: true,
                data: student
            };
        } catch (error) {
            return ctx.internalServerError(error.message);
        }
    }
};
