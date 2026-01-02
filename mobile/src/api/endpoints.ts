/**
 * API Endpoints for Strapi resources
 */

import { apiClient } from './client';

// Types
export interface Student {
    id: number;
    studentNumber: string;
    dateOfBirth: string;
    gender: string;
    classroom: string;
    user?: {
        id: number;
        username: string;
        email: string;
    };
}

export interface Schedule {
    id: number;
    title: string;
    scheduleType: string;
    startTime: string;
    endTime: string;
    location: string;
}

export interface AttendanceLog {
    id: number;
    eventType: 'check_in' | 'check_out';
    method: string;
    recordedAt: string;
    confidenceScore?: number;
}

// API Functions
export async function getStudentProfiles(): Promise<{ data: Student[] }> {
    return apiClient.fetch('/api/student-profiles');
}

export async function getStudentProfile(id: number): Promise<{ data: Student }> {
    return apiClient.fetch(`/api/student-profiles/${id}`);
}

export async function getSchedules(date?: string): Promise<{ data: Schedule[] }> {
    const query = date ? `?filters[startTime][$gte]=${date}` : '';
    return apiClient.fetch(`/api/schedules${query}`);
}

export async function getTodaySchedules(): Promise<{ data: Schedule[] }> {
    const today = new Date().toISOString().split('T')[0];
    return getSchedules(today);
}

export async function createAttendance(data: {
    eventType: 'check_in' | 'check_out';
    method: string;
    photoBase64?: string;
    location?: string;
}): Promise<{ data: AttendanceLog }> {
    return apiClient.fetch('/api/attendance-logs', {
        method: 'POST',
        body: JSON.stringify({ data }),
    });
}

export async function getMyAttendance(): Promise<{ data: AttendanceLog[] }> {
    return apiClient.fetch('/api/attendance-logs?sort=recordedAt:desc&pagination[limit]=10');
}

// Face recognition via AI service
export async function checkInWithFace(imageBase64: string): Promise<{
    success: boolean;
    studentName?: string;
    confidence?: number;
}> {
    // This goes to AI service, not Strapi
    const aiUrl = process.env.EXPO_PUBLIC_AI_URL || 'http://localhost:8000';

    const response = await fetch(`${aiUrl}/api/face/identify`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-tenant-id': apiClient.getTenant(),
        },
        body: JSON.stringify({ image: imageBase64 }),
    });

    if (!response.ok) {
        throw new Error('Face recognition failed');
    }

    return response.json();
}
