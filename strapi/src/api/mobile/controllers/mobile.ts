/**
 * Mobile API Controller
 * Optimized endpoints for mobile app consumption
 */

import type { Core } from '@strapi/strapi';

export default {
    /**
     * Get today's summary for dashboard
     * GET /api/mobile/today
     */
    async today(ctx: any) {
        const strapi: Core.Strapi = ctx.strapi || global.strapi;
        const user = ctx.state.user;
        const tenantId = ctx.state.tenant?.id;

        const today = new Date().toISOString().split('T')[0];

        try {
            // Get attendance stats
            const attendanceLogs = await strapi.db.query('api::attendance-log.attendance-log').findMany({
                where: {
                    date: today,
                    ...(tenantId ? { tenant: tenantId } : {}),
                },
                select: ['status'],
            });

            const stats = attendanceLogs.reduce(
                (acc: { present: number; late: number; absent: number }, log: { status: string }) => {
                    if (log.status === 'present') acc.present++;
                    else if (log.status === 'late') acc.late++;
                    else if (log.status === 'absent') acc.absent++;
                    return acc;
                },
                { present: 0, late: 0, absent: 0 }
            );

            // Get session counts
            const sessions = await strapi.db.query('api::schedule.schedule').findMany({
                where: {
                    date: today,
                    ...(tenantId ? { tenant: tenantId } : {}),
                    ...(user.role?.type === 'teacher' ? { teacher: user.id } : {}),
                },
                select: ['status'],
            });

            const sessionStats = sessions.reduce(
                (acc: { completed: number; upcoming: number }, s: { status: string }) => {
                    if (s.status === 'completed') acc.completed++;
                    else if (s.status === 'scheduled') acc.upcoming++;
                    return acc;
                },
                { completed: 0, upcoming: 0 }
            );

            const total = stats.present + stats.late + stats.absent;

            return {
                date: today,
                totalStudents: total,
                presentCount: stats.present,
                absentCount: stats.absent,
                lateCount: stats.late,
                attendanceRate: total > 0 ? Math.round((stats.present / total) * 100) : 0,
                upcomingSessions: sessionStats.upcoming,
                completedSessions: sessionStats.completed,
            };
        } catch (error) {
            strapi.log.error('Mobile today error:', error);
            return ctx.internalServerError('Failed to fetch today summary');
        }
    },

    /**
     * Get schedule for a specific date
     * GET /api/mobile/schedule/:date
     */
    async schedule(ctx: any) {
        const strapi: Core.Strapi = ctx.strapi || global.strapi;
        const user = ctx.state.user;
        const tenantId = ctx.state.tenant?.id;
        const { date } = ctx.params;

        if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return ctx.badRequest('Invalid date format. Use YYYY-MM-DD');
        }

        try {
            const where: Record<string, unknown> = { date };

            if (tenantId) where.tenant = tenantId;
            if (user.role?.type === 'teacher') where.teacher = user.id;

            const sessions = await strapi.entityService.findMany('api::schedule.schedule', {
                filters: where as any,
                populate: ['student', 'teacher'] as any,
                sort: { startTime: 'asc' } as any,
            });

            return {
                date,
                sessions: (sessions as any[]).map((s) => ({
                    id: s.id,
                    startTime: s.startTime,
                    endTime: s.endTime,
                    duration: s.duration || 45,
                    type: s.type || 'other',
                    title: s.title || 'Seans',
                    status: s.status || 'scheduled',
                    student: s.student ? {
                        id: s.student.id,
                        name: `${s.student.firstName || ''} ${s.student.lastName || ''}`.trim(),
                    } : null,
                    teacher: s.teacher ? {
                        id: s.teacher.id,
                        name: s.teacher.username,
                    } : null,
                })),
                count: (sessions as any[]).length,
            };
        } catch (error) {
            strapi.log.error('Mobile schedule error:', error);
            return ctx.internalServerError('Failed to fetch schedule');
        }
    },

    /**
     * Record attendance check-in
     * POST /api/mobile/checkin
     */
    async checkin(ctx: any) {
        const strapi: Core.Strapi = ctx.strapi || global.strapi;
        const user = ctx.state.user;
        const tenantId = ctx.state.tenant?.id;
        const { studentId, confidenceScore, offlineId } = ctx.request.body;

        if (!studentId) {
            return ctx.badRequest('Student ID is required');
        }

        try {
            const now = new Date();
            const today = now.toISOString().split('T')[0];
            const checkInTime = now.toISOString();

            // Check for duplicate (using offlineId for deduplication)
            if (offlineId) {
                const existing = await strapi.db.query('api::attendance-log.attendance-log').findOne({
                    where: { offlineId },
                });
                if (existing) {
                    return { data: existing, duplicate: true };
                }
            }

            // Determine status based on time
            const hours = now.getHours();
            const minutes = now.getMinutes();
            const status = hours > 9 || (hours === 9 && minutes > 15) ? 'late' : 'present';

            // Create attendance record
            const attendance = await strapi.entityService.create('api::attendance-log.attendance-log', {
                data: {
                    student: studentId,
                    date: today,
                    checkInTime,
                    status,
                    verificationMethod: 'face_recognition',
                    confidenceScore: confidenceScore || null,
                    offlineId: offlineId || null,
                    recordedBy: user.id,
                    tenant: tenantId,
                } as any,
                populate: ['student'] as any,
            });

            // Create audit log
            try {
                await strapi.db.query('api::audit-log.audit-log').create({
                    data: {
                        action: 'checkin',
                        entityType: 'attendance-log',
                        entityId: attendance.id,
                        userId: user.id,
                        ipAddress: ctx.request.ip,
                        timestamp: now,
                        success: true,
                        metadata: { studentId, confidenceScore, status },
                    },
                });
            } catch {
                // Don't fail if audit fails
            }

            return {
                data: {
                    id: attendance.id,
                    studentId: (attendance as any).student?.id,
                    studentName: `${(attendance as any).student?.firstName || ''} ${(attendance as any).student?.lastName || ''}`.trim(),
                    checkInTime,
                    status,
                    confidenceScore,
                },
                duplicate: false,
            };
        } catch (error) {
            strapi.log.error('Mobile checkin error:', error);
            return ctx.internalServerError('Failed to record check-in');
        }
    },

    /**
     * Get attendance for today
     * GET /api/mobile/attendance
     */
    async attendance(ctx: any) {
        const strapi: Core.Strapi = ctx.strapi || global.strapi;
        const tenantId = ctx.state.tenant?.id;
        const { date, page = 1, pageSize = 50 } = ctx.query;

        const queryDate = date || new Date().toISOString().split('T')[0];

        try {
            const where: Record<string, unknown> = { date: queryDate };
            if (tenantId) where.tenant = tenantId;

            const [entries, count] = await Promise.all([
                strapi.entityService.findMany('api::attendance-log.attendance-log', {
                    filters: where as any,
                    populate: ['student'] as any,
                    sort: { checkInTime: 'desc' } as any,
                    start: (Number(page) - 1) * Number(pageSize),
                    limit: Number(pageSize),
                }),
                strapi.db.query('api::attendance-log.attendance-log').count({ where }),
            ]);

            return {
                data: (entries as any[]).map((e) => ({
                    id: e.id,
                    studentId: e.student?.id,
                    studentName: `${e.student?.firstName || ''} ${e.student?.lastName || ''}`.trim(),
                    date: e.date,
                    checkInTime: e.checkInTime,
                    checkOutTime: e.checkOutTime,
                    status: e.status,
                    verificationMethod: e.verificationMethod,
                    confidenceScore: e.confidenceScore,
                })),
                meta: {
                    pagination: {
                        page: Number(page),
                        pageSize: Number(pageSize),
                        pageCount: Math.ceil(count / Number(pageSize)),
                        total: count,
                    },
                },
            };
        } catch (error) {
            strapi.log.error('Mobile attendance error:', error);
            return ctx.internalServerError('Failed to fetch attendance');
        }
    },

    /**
     * Get students for parent
     * GET /api/mobile/my-students
     */
    async myStudents(ctx: any) {
        const strapi: Core.Strapi = ctx.strapi || global.strapi;
        const user = ctx.state.user;

        try {
            const students = await strapi.entityService.findMany('api::student-profile.student-profile', {
                filters: {
                    parentGuardian: user.id,
                } as any,
                populate: ['photo'] as any,
            });

            return {
                data: (students as any[]).map((s) => ({
                    id: s.id,
                    firstName: s.firstName,
                    lastName: s.lastName,
                    fullName: `${s.firstName || ''} ${s.lastName || ''}`.trim(),
                    photo: s.photo?.url || null,
                    birthDate: s.dogumTarihi,
                    disability: s.engelTuru,
                })),
                count: (students as any[]).length,
            };
        } catch (error) {
            strapi.log.error('Mobile my-students error:', error);
            return ctx.internalServerError('Failed to fetch students');
        }
    },
};
