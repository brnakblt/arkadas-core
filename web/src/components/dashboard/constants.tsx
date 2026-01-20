
import { Student, StudentStatus, DiagnosisType, Session, SessionStatus, Staff, LeaveRequest, Training, LessonPlan, TaskAssignment } from './types';

export const MOCK_STUDENTS: Student[] = [
    {
        id: '1',
        tcIdentity: '12345678901',
        fullName: 'Ali Yılmaz',
        birthDate: '2015-05-15',
        diagnosis: DiagnosisType.AUTISM,
        status: StudentStatus.ACTIVE,
        ramReportEndDate: '2024-12-30',
        parentName: 'Ayşe Yılmaz',
        parentPhone: '05551112233',
        avatarUrl: 'https://picsum.photos/200/200?random=1'
    },
    {
        id: '2',
        tcIdentity: '23456789012',
        fullName: 'Zeynep Kaya',
        birthDate: '2016-08-20',
        diagnosis: DiagnosisType.DYSLEXIA,
        status: StudentStatus.ACTIVE,
        ramReportEndDate: '2025-06-15',
        parentName: 'Mehmet Kaya',
        parentPhone: '05554445566',
        avatarUrl: 'https://picsum.photos/200/200?random=2'
    }
];

export const MOCK_STAFF: Staff[] = [
    {
        id: 't1',
        fullName: 'Elif Öğretmen',
        specialty: 'Özel Eğitim Uzmanı',
        email: 'elif@arkadas.edu.tr',
        phone: '05051234567',
        joinDate: '2022-09-01',
        status: 'Active',
        weeklyHours: 30,
        maxWeeklyHours: 40,
        performanceScore: 92,
        avatarUrl: 'https://picsum.photos/200/200?random=11'
    },
    {
        id: 't2',
        fullName: 'Burak Hoca',
        specialty: 'Fizyoterapist',
        email: 'burak@arkadas.edu.tr',
        phone: '05059876543',
        joinDate: '2023-01-15',
        status: 'Active',
        weeklyHours: 25,
        maxWeeklyHours: 30,
        performanceScore: 88,
        avatarUrl: 'https://picsum.photos/200/200?random=12'
    }
];

export const MOCK_SESSIONS: Session[] = [
    { id: 's1', studentId: '1', teacherId: 't1', dateTime: new Date().toISOString(), status: SessionStatus.BSDK_PENDING }
];

export const MOCK_LEAVE_REQUESTS: LeaveRequest[] = [];
export const MOCK_TRAININGS: Training[] = [];
export const MOCK_LESSON_PLANS: LessonPlan[] = [];
export const MOCK_TASKS: TaskAssignment[] = [];
