/**
 * Arkadaş ERP - Shared Data Models
 */

export interface Student {
    id: number;
    tcIdentity: string;
    studentNumber?: string;
    fullName: string;
    email?: string;
    phone?: string;
    birthDate?: string;
    bloodType?: string;
}

export interface Personnel {
    id: number;
    tcIdentity: string;
    fullName: string;
    title?: string;
    email: string;
    phone?: string;
}

export interface AttendanceLog {
    id: number;
    student?: Student;
    staff?: Personnel;
    date: string;
    checkInTime: string;
    checkOutTime?: string;
    status: 'present' | 'absent' | 'late' | 'early_exit';
    livenessVerified: boolean;
    confidenceScore?: number;
    mebbisSyncStatus: 'synced' | 'pending' | 'failed';
}

export interface StorageFile {
    id: number;
    name: string;
    path: string;
    size: number;
    mimeType: string;
    isDirectory: boolean;
    storageBackend: 'webdav' | 'local';
}
