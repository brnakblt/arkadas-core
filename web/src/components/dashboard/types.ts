
export enum StudentStatus {
    ACTIVE = 'Aktif',
    PASSIVE = 'Pasif',
    GRADUATED = 'Mezun',
    WAITING_RAM = 'RAM Raporu Bekliyor'
}

export enum SessionStatus {
    SCHEDULED = 'Planlandı',
    COMPLETED = 'Tamamlandı',
    CANCELLED = 'İptal',
    ABSENT = 'Gelmedi',
    BSDK_PENDING = 'BSDK Bekleniyor',
    BSDK_VERIFIED = 'BSDK Doğrulandı',
    BSDK_FAILED = 'BSDK Hatası'
}

export enum DiagnosisType {
    AUTISM = 'Otizm Spektrum Bozukluğu',
    DYSLEXIA = 'Özgül Öğrenme Güçlüğü',
    INTELLECTUAL = 'Zihinsel Yetersizlik',
    HEARING = 'İşitme Yetersizliği',
    PHYSICAL = 'Bedensel Yetersizlik'
}

export interface Student {
    id: string;
    tcIdentity: string;
    fullName: string;
    birthDate: string;
    diagnosis: DiagnosisType;
    status: StudentStatus;
    ramReportEndDate: string;
    parentName: string;
    parentPhone: string;
    avatarUrl: string;
}

export interface Staff {
    id: string;
    fullName: string;
    specialty: string;
    email: string;
    phone: string;
    joinDate: string;
    status: 'Active' | 'OnLeave' | 'Terminated';
    weeklyHours: number;
    maxWeeklyHours?: number;
    performanceScore?: number;
    avatarUrl?: string;
}

export interface Session {
    id: string;
    studentId: string;
    teacherId: string;
    dateTime: string;
    status: SessionStatus;
    notes?: string;
}

export interface LeaveRequest {
    id: string;
    staffId: string;
    type: 'Yıllık İzin' | 'Rapor' | 'İdari İzin';
    startDate: string;
    endDate: string;
    status: 'Pending' | 'Approved' | 'Rejected';
    description: string;
}

export interface Training {
    id: string;
    staffId: string;
    title: string;
    date: string;
    status: 'Completed' | 'Upcoming';
}

export interface LessonPlan {
    id: string;
    staffId: string;
    week: number;
    subject: string;
    description: string;
    status: 'Draft' | 'Submitted' | 'Approved' | 'NeedsRevision';
    submissionDate: string;
}

export interface TaskAssignment {
    id: string;
    staffId: string;
    title: string;
    description: string;
    dueDate: string;
    priority: 'Low' | 'Medium' | 'High';
    status: 'Pending' | 'InProgress' | 'Completed';
}
