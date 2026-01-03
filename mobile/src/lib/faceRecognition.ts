/**
 * Face Recognition Service
 * Integrates with AI service for face identification
 */

import * as FileSystem from 'expo-file-system';
import { api } from './api';

const AI_SERVICE_URL = process.env.EXPO_PUBLIC_AI_URL || 'http://localhost:8000';

export interface FaceRecognitionResult {
    success: boolean;
    student?: {
        id: number;
        name: string;
        photo?: string;
        confidence: number;
    };
    error?: string;
}

export interface AttendanceRecord {
    id: number;
    studentId: number;
    studentName: string;
    checkInTime: string;
    checkOutTime?: string;
    status: 'present' | 'late' | 'absent' | 'excused';
    verificationMethod: 'face_recognition' | 'manual' | 'card';
    confidenceScore?: number;
}

class FaceRecognitionService {
    /**
     * Capture photo and identify student via AI service
     */
    async identifyStudent(imageUri: string): Promise<FaceRecognitionResult> {
        try {
            // Read image as base64
            const base64Image = await FileSystem.readAsStringAsync(imageUri, {
                encoding: FileSystem.EncodingType.Base64,
            });

            // Call AI service face identification endpoint
            const response = await fetch(`${AI_SERVICE_URL}/api/face/identify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-tenant-id': api.getTenantSlug(),
                },
                body: JSON.stringify({
                    image: base64Image,
                    threshold: 0.6, // Confidence threshold
                }),
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                return {
                    success: false,
                    error: error.detail || `AI service error: ${response.status}`,
                };
            }

            const data = await response.json();

            if (!data.match) {
                return {
                    success: false,
                    error: 'Yüz tanınamadı. Tekrar deneyin.',
                };
            }

            return {
                success: true,
                student: {
                    id: data.student_id,
                    name: data.student_name,
                    photo: data.student_photo,
                    confidence: data.confidence,
                },
            };
        } catch (error) {
            console.error('[FaceRecognition] Identify failed:', error);
            return {
                success: false,
                error: 'Bağlantı hatası. İnternet bağlantınızı kontrol edin.',
            };
        }
    }

    /**
     * Record attendance check-in via Strapi mobile API
     */
    async checkIn(
        studentId: number,
        method: 'face_recognition' | 'manual' = 'face_recognition',
        confidenceScore?: number,
        offlineId?: string
    ): Promise<AttendanceRecord | null> {
        try {
            const response = await api.fetch<{ data: AttendanceRecord }>(
                '/api/mobile/checkin',
                {
                    method: 'POST',
                    body: JSON.stringify({
                        studentId,
                        confidenceScore,
                        offlineId,
                    }),
                }
            );

            return response.data;
        } catch (error) {
            console.error('[FaceRecognition] Check-in failed:', error);
            return null;
        }
    }

    /**
     * Record attendance check-out
     */
    async checkOut(attendanceId: number): Promise<boolean> {
        try {
            await api.fetch(`/api/attendance-logs/${attendanceId}`, {
                method: 'PUT',
                body: JSON.stringify({
                    data: {
                        checkOutTime: new Date().toISOString(),
                    },
                }),
            });
            return true;
        } catch (error) {
            console.error('[FaceRecognition] Check-out failed:', error);
            return false;
        }
    }

    /**
     * Get today's attendance using mobile API
     */
    async getTodayAttendance(): Promise<AttendanceRecord[]> {
        try {
            const response = await api.fetch<{ data: AttendanceRecord[] }>(
                '/api/mobile/attendance'
            );
            return response.data || [];
        } catch (error) {
            console.error('[FaceRecognition] Get attendance failed:', error);
            return [];
        }
    }

    /**
     * Determine if student is late based on configured time
     */
    private getAttendanceStatus(): 'present' | 'late' {
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();

        // Late if after 09:15
        if (hours > 9 || (hours === 9 && minutes > 15)) {
            return 'late';
        }
        return 'present';
    }
}

export const faceRecognition = new FaceRecognitionService();
