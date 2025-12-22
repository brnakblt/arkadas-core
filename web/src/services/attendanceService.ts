/**
 * Attendance Service
 * API calls for attendance logs, statistics, and reports
 */

const API_BASE = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

interface AttendanceRecord {
    id: number;
    documentId: string;
    checkInTime?: string;
    checkOutTime?: string;
    status: 'present' | 'absent' | 'late' | 'excused';
    verificationMethod: 'face_recognition' | 'manual' | 'card' | 'qr_code';
    faceMatchConfidence?: number;
    notes?: string;
    student?: {
        id: number;
        fullName: string;
        user?: { username: string };
    };
}

interface AttendanceStats {
    totalStudents: number;
    presentToday: number;
    absentToday: number;
    lateToday: number;
    attendanceRate: number;
}

interface CreateAttendanceData {
    studentId: number;
    checkInTime?: string;
    checkOutTime?: string;
    status: 'present' | 'absent' | 'late' | 'excused';
    verificationMethod: 'face_recognition' | 'manual' | 'card' | 'qr_code';
    faceMatchConfidence?: number;
    notes?: string;
}

class AttendanceService {
    private token: string | null = null;

    setAuthToken(token: string) {
        this.token = token;
    }

    private getHeaders(): HeadersInit {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        return headers;
    }

    /**
     * Get attendance records for a specific date
     */
    async getAttendanceByDate(date: string): Promise<AttendanceRecord[]> {
        const startOfDay = `${date}T00:00:00.000Z`;
        const endOfDay = `${date}T23:59:59.999Z`;

        const response = await fetch(
            `${API_BASE}/api/attendance-logs?` +
            `filters[checkInTime][$gte]=${startOfDay}&` +
            `filters[checkInTime][$lte]=${endOfDay}&` +
            `populate=student`,
            { headers: this.getHeaders() }
        );

        if (!response.ok) {
            throw new Error('Failed to fetch attendance records');
        }

        const data = await response.json();
        return data.data || [];
    }

    /**
     * Get attendance records for a student
     */
    async getStudentAttendance(studentId: number, startDate?: string, endDate?: string): Promise<AttendanceRecord[]> {
        let url = `${API_BASE}/api/attendance-logs?filters[student][id][$eq]=${studentId}&sort=checkInTime:desc`;

        if (startDate) {
            url += `&filters[checkInTime][$gte]=${startDate}T00:00:00.000Z`;
        }
        if (endDate) {
            url += `&filters[checkInTime][$lte]=${endDate}T23:59:59.999Z`;
        }

        const response = await fetch(url, { headers: this.getHeaders() });

        if (!response.ok) {
            throw new Error('Failed to fetch student attendance');
        }

        const data = await response.json();
        return data.data || [];
    }

    /**
     * Create a new attendance record
     */
    async createAttendance(data: CreateAttendanceData): Promise<AttendanceRecord> {
        const response = await fetch(`${API_BASE}/api/attendance-logs`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({
                data: {
                    student: data.studentId,
                    checkInTime: data.checkInTime || new Date().toISOString(),
                    checkOutTime: data.checkOutTime,
                    status: data.status,
                    verificationMethod: data.verificationMethod,
                    faceMatchConfidence: data.faceMatchConfidence,
                    notes: data.notes,
                },
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to create attendance record');
        }

        const result = await response.json();
        return result.data;
    }

    /**
     * Update attendance record
     */
    async updateAttendance(id: string, updates: Partial<CreateAttendanceData>): Promise<AttendanceRecord> {
        const response = await fetch(`${API_BASE}/api/attendance-logs/${id}`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify({ data: updates }),
        });

        if (!response.ok) {
            throw new Error('Failed to update attendance record');
        }

        const result = await response.json();
        return result.data;
    }

    /**
     * Check out a student
     */
    async checkOut(attendanceId: string): Promise<AttendanceRecord> {
        return this.updateAttendance(attendanceId, {
            checkOutTime: new Date().toISOString(),
        });
    }

    /**
     * Get daily statistics
     */
    async getDailyStats(date: string): Promise<AttendanceStats> {
        const records = await this.getAttendanceByDate(date);

        // Get total students count
        const studentsResponse = await fetch(
            `${API_BASE}/api/student-profiles?pagination[limit]=0`,
            { headers: this.getHeaders() }
        );
        const studentsData = await studentsResponse.json();
        const totalStudents = studentsData.meta?.pagination?.total || 0;

        const presentCount = records.filter(r => r.status === 'present').length;
        const absentCount = records.filter(r => r.status === 'absent').length;
        const lateCount = records.filter(r => r.status === 'late').length;

        return {
            totalStudents,
            presentToday: presentCount,
            absentToday: absentCount,
            lateToday: lateCount,
            attendanceRate: totalStudents > 0
                ? ((presentCount + lateCount) / totalStudents) * 100
                : 0,
        };
    }

    /**
     * Get monthly report
     */
    async getMonthlyReport(year: number, month: number): Promise<{
        date: string;
        present: number;
        absent: number;
        late: number;
        excused: number;
    }[]> {
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const endDate = new Date(year, month, 0).toISOString().split('T')[0];

        const response = await fetch(
            `${API_BASE}/api/attendance-logs?` +
            `filters[checkInTime][$gte]=${startDate}T00:00:00.000Z&` +
            `filters[checkInTime][$lte]=${endDate}T23:59:59.999Z&` +
            `pagination[limit]=1000`,
            { headers: this.getHeaders() }
        );

        if (!response.ok) {
            throw new Error('Failed to fetch monthly report');
        }

        const data = await response.json();
        const records: AttendanceRecord[] = data.data || [];

        // Group by date
        const grouped: Record<string, { present: number; absent: number; late: number; excused: number }> = {};

        records.forEach(record => {
            const date = record.checkInTime?.split('T')[0] || '';
            if (!grouped[date]) {
                grouped[date] = { present: 0, absent: 0, late: 0, excused: 0 };
            }
            grouped[date][record.status]++;
        });

        return Object.entries(grouped).map(([date, counts]) => ({
            date,
            ...counts,
        })).sort((a, b) => a.date.localeCompare(b.date));
    }

    /**
     * Record attendance via face recognition
     */
    async recordWithFaceRecognition(
        studentId: number,
        confidenceScore: number,
        type: 'checkIn' | 'checkOut'
    ): Promise<AttendanceRecord> {
        if (type === 'checkIn') {
            return this.createAttendance({
                studentId,
                status: 'present',
                verificationMethod: 'face_recognition',
                faceMatchConfidence: confidenceScore,
            });
        } else {
            // Find today's record and update checkout
            const today = new Date().toISOString().split('T')[0];
            const records = await this.getStudentAttendance(studentId, today, today);

            if (records.length > 0) {
                return this.checkOut(records[0].documentId);
            }

            throw new Error('No check-in record found for today');
        }
    }
}

export const attendanceService = new AttendanceService();
export type { AttendanceRecord, AttendanceStats, CreateAttendanceData };
