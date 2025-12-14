'use strict';

/**
 * appointment controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::appointment.appointment', ({ strapi }) => ({
    // Get appointments for current user
    async findMine(ctx) {
        const user = ctx.state.user;

        if (!user) {
            return ctx.unauthorized('Giriş yapmanız gerekiyor');
        }

        const appointments = await strapi.entityService.findMany('api::appointment.appointment', {
            filters: { requestedBy: user.id },
            populate: ['student', 'teacher'],
            sort: { date: 'asc', startTime: 'asc' },
        });

        return appointments;
    },

    // Get available time slots
    async getAvailableSlots(ctx) {
        const { teacherId, date } = ctx.query;

        if (!teacherId || !date) {
            return ctx.badRequest('teacherId ve date gerekli');
        }

        // Get existing appointments for the teacher on this date
        const existingAppointments = await strapi.entityService.findMany('api::appointment.appointment', {
            filters: {
                teacher: teacherId,
                date: date,
                status: { $ne: 'cancelled' },
            },
        });

        // Define available time slots (09:00 - 17:00, 30 min intervals)
        const allSlots = [];
        for (let hour = 9; hour < 17; hour++) {
            allSlots.push(`${hour.toString().padStart(2, '0')}:00`);
            allSlots.push(`${hour.toString().padStart(2, '0')}:30`);
        }

        // Filter out booked slots
        const bookedSlots = existingAppointments.map(apt => apt.startTime.substring(0, 5));
        const availableSlots = allSlots.filter(slot => !bookedSlots.includes(slot));

        return { date, teacherId, slots: availableSlots };
    },

    // Book an appointment
    async book(ctx) {
        const user = ctx.state.user;

        if (!user) {
            return ctx.unauthorized('Giriş yapmanız gerekiyor');
        }

        const { teacherId, studentId, date, startTime, type, title, description } = ctx.request.body;

        if (!teacherId || !studentId || !date || !startTime) {
            return ctx.badRequest('Zorunlu alanlar eksik');
        }

        // Calculate end time (30 min appointments)
        const [hours, minutes] = startTime.split(':').map(Number);
        const endMinutes = minutes + 30;
        const endHours = hours + Math.floor(endMinutes / 60);
        const endTime = `${endHours.toString().padStart(2, '0')}:${(endMinutes % 60).toString().padStart(2, '0')}`;

        // Check if slot is still available
        const existing = await strapi.entityService.findMany('api::appointment.appointment', {
            filters: {
                teacher: teacherId,
                date: date,
                startTime: startTime,
                status: { $ne: 'cancelled' },
            },
        });

        if (existing.length > 0) {
            return ctx.badRequest('Bu zaman dilimi dolu');
        }

        // Create appointment
        const appointment = await strapi.entityService.create('api::appointment.appointment', {
            data: {
                title: title || 'Veli Görüşmesi',
                description,
                date,
                startTime,
                endTime,
                type: type || 'in-person',
                status: 'pending',
                student: studentId,
                teacher: teacherId,
                requestedBy: user.id,
            },
            populate: ['student', 'teacher'],
        });

        return appointment;
    },

    // Cancel an appointment
    async cancel(ctx) {
        const user = ctx.state.user;
        const { id } = ctx.params;

        if (!user) {
            return ctx.unauthorized('Giriş yapmanız gerekiyor');
        }

        const appointment = await strapi.entityService.findOne('api::appointment.appointment', id, {
            populate: ['requestedBy'],
        });

        if (!appointment) {
            return ctx.notFound('Randevu bulunamadı');
        }

        if (appointment.requestedBy?.id !== user.id) {
            return ctx.forbidden('Bu randevuyu iptal edemezsiniz');
        }

        const updated = await strapi.entityService.update('api::appointment.appointment', id, {
            data: { status: 'cancelled' },
        });

        return updated;
    },

    // Confirm appointment (teacher only)
    async confirm(ctx) {
        const { id } = ctx.params;

        const updated = await strapi.entityService.update('api::appointment.appointment', id, {
            data: { status: 'confirmed' },
            populate: ['student', 'teacher', 'requestedBy'],
        });

        return updated;
    },
}));
