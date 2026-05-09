const { mebbisQueue, notificationQueue } = require('../../../../utils/queue');

module.exports = {
    async afterCreate(event) {
        const { result } = event;
        const { id, student, staff, checkInTime, livenessVerified } = result;

        try {
            // 1. Queue Mebbis Sync
            await mebbisQueue.add(`sync-${id}`, {
                logId: id,
                studentId: student?.id,
                staffId: staff?.id,
                timestamp: checkInTime,
                verified: livenessVerified
            });
            strapi.log.info(`[Attendance] Added log ${id} to Mebbis sync queue.`);

            // 2. Queue Parent Notification
            await notificationQueue.add(`notify-${id}`, {
                logId: id,
                type: 'attendance_checkin'
            });
            strapi.log.info(`[Attendance] Added log ${id} to notification queue.`);

        } catch (error) {
            strapi.log.error(`[Attendance] Queue Error: ${error.message}`);
        }
    },
};
