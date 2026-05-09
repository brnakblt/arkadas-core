'use strict';

/**
 * Schedule Validator Service
 * Enforces MEB (Turkish Ministry of Education) regulations
 */

module.exports = ({ strapi }) => ({
    /**
     * Check if a teacher has exceeded their 8-hour daily limit
     */
    async checkTeacherDailyLimit(teacherId, date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const sessions = await strapi.entityService.findMany('api::session-plan.session-plan', {
            filters: {
                teacher: teacherId,
                startTime: { $gte: startOfDay.toISOString(), $lte: endOfDay.toISOString() },
                status: { $ne: 'CANCELLED' }
            }
        });

        // Simplified: Each session is 1 hour for now
        return sessions.length < 8;
    },

    /**
     * Check if a student has exceeded 2 individual + 1 group session per day
     */
    async checkStudentDailyLimit(studentId, date, isGroup = false) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const sessions = await strapi.entityService.findMany('api::session-plan.session-plan', {
            filters: {
                student: studentId,
                startTime: { $gte: startOfDay.toISOString(), $lte: endOfDay.toISOString() },
                status: { $ne: 'CANCELLED' }
            }
        });

        const individualCount = sessions.filter(s => !s.isGroup).length;
        const groupCount = sessions.filter(s => s.isGroup).length;

        if (isGroup) {
            return groupCount < 1;
        } else {
            return individualCount < 2;
        }
    },

    /**
     * Check if a student has remaining hours for a specific module in their RAM report
     */
    async checkModuleLimit(studentId, moduleId, date) {
        // 1. Get the module definition
        const module = await strapi.entityService.findOne('api::educational-module.educational-module', moduleId);
        if (!module) return true;

        // 2. Count sessions for this student + module in the current month
        const startOfMonth = new Date(date);
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        
        const endOfMonth = new Date(date);
        endOfMonth.setMonth(endOfMonth.getMonth() + 1);
        endOfMonth.setDate(0);
        endOfMonth.setHours(23, 59, 59, 999);

        const monthlySessions = await strapi.entityService.findMany('api::session-plan.session-plan', {
            filters: {
                student: studentId,
                module: moduleId,
                startTime: { $gte: startOfMonth.toISOString(), $lte: endOfMonth.toISOString() },
                status: { $ne: 'CANCELLED' }
            }
        });

        return monthlySessions.length < (module.totalMonthlyHours || 8);
    },

    /**
     * Check for physical classroom conflicts
     */
    async checkRoomConflict(classroomId, startTime, endTime, excludeId = null) {
        const filters = {
            classroom: classroomId,
            status: { $ne: 'CANCELLED' },
            $or: [
                {
                    startTime: { $lt: endTime },
                    endTime: { $gt: startTime }
                }
            ]
        };

        if (excludeId) {
            filters.id = { $ne: excludeId };
        }

        const conflict = await strapi.entityService.findMany('api::session-plan.session-plan', {
            filters,
            limit: 1
        });

        return conflict.length === 0;
    }
});
