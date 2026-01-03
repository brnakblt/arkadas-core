/**
 * API Endpoints - Mobile-optimized Strapi queries
 */

import { api } from './api';

// Types
export interface Student {
    id: number;
    firstName: string;
    lastName: string;
    fullName: string;
    photo?: { url: string };
    parent?: { id: number; email: string };
}

export interface Session {
    id: number;
    startTime: string;
    endTime: string;
    duration: number;
    type: 'speech' | 'special' | 'physio' | 'other';
    title: string;
    student: Student;
    status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
    notes?: string;
}

export interface Message {
    id: number;
    content: string;
    sender: { id: number; username: string };
    recipient: { id: number; username: string };
    sentAt: string;
    readAt?: string;
    isRead: boolean;
}

export interface DaySummary {
    date: string;
    totalStudents: number;
    presentCount: number;
    absentCount: number;
    lateCount: number;
    attendanceRate: number;
    upcomingSessions: number;
    completedSessions: number;
}

// Endpoints
export const endpoints = {
    /**
     * Get today's summary for dashboard
     */
    async getTodaySummary(): Promise<DaySummary> {
        const today = new Date().toISOString().split('T')[0];

        try {
            // Aggregate attendance stats
            const attendance = await api.fetch<{ data: { attributes: { status: string } }[] }>(
                `/api/attendance-logs?filters[date][$eq]=${today}&fields[0]=status`
            );

            const stats = attendance.data.reduce(
                (acc, record) => {
                    const status = record.attributes.status;
                    if (status === 'present') acc.present++;
                    else if (status === 'late') acc.late++;
                    else if (status === 'absent') acc.absent++;
                    return acc;
                },
                { present: 0, late: 0, absent: 0 }
            );

            // Get session counts
            const sessions = await api.fetch<{ data: { attributes: { status: string } }[] }>(
                `/api/schedules?filters[date][$eq]=${today}&fields[0]=status`
            );

            const sessionStats = sessions.data.reduce(
                (acc, session) => {
                    if (session.attributes.status === 'completed') acc.completed++;
                    else if (session.attributes.status === 'scheduled') acc.upcoming++;
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
            console.error('[Endpoints] getTodaySummary failed:', error);
            // Return mock data for offline
            return {
                date: today,
                totalStudents: 0,
                presentCount: 0,
                absentCount: 0,
                lateCount: 0,
                attendanceRate: 0,
                upcomingSessions: 0,
                completedSessions: 0,
            };
        }
    },

    /**
     * Get schedule for a specific date
     */
    async getSchedule(date: string): Promise<Session[]> {
        try {
            const response = await api.fetch<{ data: Array<{ id: number; attributes: Record<string, unknown> }> }>(
                `/api/schedules?filters[date][$eq]=${date}&populate[student][fields][0]=firstName&populate[student][fields][1]=lastName&sort=startTime:asc`
            );

            return response.data.map((item) => ({
                id: item.id,
                ...(item.attributes as unknown as Omit<Session, 'id'>),
            }));
        } catch (error) {
            console.error('[Endpoints] getSchedule failed:', error);
            return [];
        }
    },

    /**
     * Get messages for current user
     */
    async getMessages(page = 1, pageSize = 20): Promise<{ messages: Message[]; hasMore: boolean }> {
        try {
            const response = await api.fetch<{
                data: Array<{ id: number; attributes: Record<string, unknown> }>;
                meta: { pagination: { pageCount: number } };
            }>(
                `/api/messages?populate=sender&populate=recipient&sort=sentAt:desc&pagination[page]=${page}&pagination[pageSize]=${pageSize}`
            );

            return {
                messages: response.data.map((item) => ({
                    id: item.id,
                    ...(item.attributes as unknown as Omit<Message, 'id'>),
                })),
                hasMore: page < response.meta.pagination.pageCount,
            };
        } catch (error) {
            console.error('[Endpoints] getMessages failed:', error);
            return { messages: [], hasMore: false };
        }
    },

    /**
     * Send a message
     */
    async sendMessage(recipientId: number, content: string): Promise<Message | null> {
        try {
            const response = await api.fetch<{ data: { id: number; attributes: Record<string, unknown> } }>(
                '/api/messages',
                {
                    method: 'POST',
                    body: JSON.stringify({
                        data: {
                            recipient: recipientId,
                            content,
                            sentAt: new Date().toISOString(),
                        },
                    }),
                }
            );

            return {
                id: response.data.id,
                ...(response.data.attributes as unknown as Omit<Message, 'id'>),
            };
        } catch (error) {
            console.error('[Endpoints] sendMessage failed:', error);
            return null;
        }
    },

    /**
     * Get students for parent
     */
    async getMyStudents(): Promise<Student[]> {
        try {
            const response = await api.fetch<{
                data: Array<{ id: number; attributes: Record<string, unknown> }>;
            }>('/api/student-profiles?filters[parentGuardian][id][$eq]=me&populate=photo');

            return response.data.map((item) => ({
                id: item.id,
                ...(item.attributes as unknown as Omit<Student, 'id'>),
            }));
        } catch (error) {
            console.error('[Endpoints] getMyStudents failed:', error);
            return [];
        }
    },

    /**
     * Get student attendance history
     */
    async getStudentAttendance(
        studentId: number,
        startDate: string,
        endDate: string
    ): Promise<Array<{ date: string; status: string; checkInTime?: string }>> {
        try {
            const response = await api.fetch<{
                data: Array<{ attributes: { date: string; status: string; checkInTime?: string } }>;
            }>(
                `/api/attendance-logs?filters[student][id][$eq]=${studentId}&filters[date][$gte]=${startDate}&filters[date][$lte]=${endDate}&sort=date:desc`
            );

            return response.data.map((item) => item.attributes);
        } catch (error) {
            console.error('[Endpoints] getStudentAttendance failed:', error);
            return [];
        }
    },

    /**
     * Get contacts for messaging
     */
    async getContacts(): Promise<Array<{ id: number; username: string; role: string }>> {
        try {
            const response = await api.fetch<{
                data: Array<{ id: number; attributes: { username: string; role: { name: string } } }>;
            }>('/api/users?populate=role');

            return response.data.map((item) => ({
                id: item.id,
                username: item.attributes.username,
                role: item.attributes.role?.name || 'unknown',
            }));
        } catch (error) {
            console.error('[Endpoints] getContacts failed:', error);
            return [];
        }
    },
};
