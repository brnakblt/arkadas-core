'use strict';

/**
 * Session Plan Lifecycle Hooks
 */

module.exports = {
    async beforeCreate(event) {
        const { data } = event.params;
        const validator = strapi.service('api::session-plan.schedule-validator');

        // 1. Check Room Conflict
        const isRoomAvailable = await validator.checkRoomConflict(data.classroom, data.startTime, data.endTime);
        if (!isRoomAvailable) {
            throw new Error('Derslik bu saatte dolu!');
        }

        // 2. Check Teacher Daily Limit
        const isTeacherAvailable = await validator.checkTeacherDailyLimit(data.teacher, data.startTime);
        if (!isTeacherAvailable) {
            throw new Error('Öğretmen günlük 8 saat limitini doldurdu!');
        }

        // 3. Check Student Daily Limit
        const isStudentAvailable = await validator.checkStudentDailyLimit(data.student, data.startTime, data.isGroup);
        if (!isStudentAvailable) {
            const msg = data.isGroup ? 'Öğrenci günlük grup dersi limitini doldurdu!' : 'Öğrenci günlük bireysel ders limitini doldurdu!';
            throw new Error(msg);
        }

        // 4. Check Module Limit (Monthly)
        if (data.module) {
            const isModuleAvailable = await validator.checkModuleLimit(data.student, data.module, data.startTime);
            if (!isModuleAvailable) {
                throw new Error('Öğrencinin bu modül için aylık limit dolmuştur!');
            }
        }
    },

    async beforeUpdate(event) {
        const { data, where } = event.params;
        if (!data.startTime || !data.endTime) return;

        const validator = strapi.service('api::session-plan.schedule-validator');

        // Check Room Conflict (excluding current record)
        const isRoomAvailable = await validator.checkRoomConflict(data.classroom, data.startTime, data.endTime, where.id);
        if (!isRoomAvailable) {
            throw new Error('Derslik bu saatte dolu!');
        }
    }
};
