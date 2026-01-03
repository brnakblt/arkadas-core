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
     * Uses optimized mobile endpoint
     */
    async getTodaySummary(): Promise<DaySummary> {
        try {
            const response = await api.fetch<DaySummary>('/api/mobile/today');
            return response;
        } catch (error) {
            console.error('[Endpoints] getTodaySummary failed:', error);
            // Return fallback data for offline
            return {
                date: new Date().toISOString().split('T')[0],
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
     * Uses optimized mobile endpoint
     */
    async getSchedule(date: string): Promise<Session[]> {
        try {
            const response = await api.fetch<{ sessions: Session[] }>(
                `/api/mobile/schedule/${date}`
            );
            return response.sessions || [];
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
