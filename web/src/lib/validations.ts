/**
 * Zod Validation Schemas for ERP Forms
 */

import { z } from 'zod';

// ============================================================
// Common Validation Patterns
// ============================================================

export const phoneRegex = /^(\+90|0)?[0-9]{10}$/;
export const tcKimlikRegex = /^[1-9][0-9]{10}$/;

export const phoneSchema = z.string()
    .regex(phoneRegex, 'Geçerli bir telefon numarası girin')
    .optional()
    .or(z.literal(''));

export const emailSchema = z.string()
    .email('Geçerli bir e-posta adresi girin')
    .min(1, 'E-posta zorunludur');

export const passwordSchema = z.string()
    // SECURITY FIX #11: Increased min length from 6 to 8 per NIST guidelines
    .min(8, 'Şifre en az 8 karakter olmalıdır')
    .max(100, 'Şifre çok uzun');

export const tcKimlikSchema = z.string()
    .regex(tcKimlikRegex, 'Geçerli bir TC Kimlik numarası girin')
    .optional()
    .or(z.literal(''));

// ============================================================
// User Schemas
// ============================================================

export const userCreateSchema = z.object({
    fullName: z.string().min(2, 'Ad soyad en az 2 karakter olmalıdır'),
    email: emailSchema,
    username: z.string()
        .min(3, 'Kullanıcı adı en az 3 karakter olmalıdır')
        .max(50, 'Kullanıcı adı çok uzun')
        .regex(/^[a-z0-9_]+$/, 'Sadece küçük harf, rakam ve alt çizgi kullanın'),
    password: passwordSchema,
    confirmPassword: z.string(),
    role: z.enum(['admin', 'teacher', 'therapist', 'driver', 'parent', 'student']),
    phone: phoneSchema,
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Şifreler eşleşmiyor',
    path: ['confirmPassword'],
});

export const userUpdateSchema = z.object({
    fullName: z.string().min(2, 'Ad soyad en az 2 karakter olmalıdır'),
    email: emailSchema,
    role: z.enum(['admin', 'teacher', 'therapist', 'driver', 'parent', 'student']),
    phone: phoneSchema,
    status: z.enum(['active', 'inactive', 'pending']).optional(),
});

export type UserCreateInput = z.infer<typeof userCreateSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;

// ============================================================
// Student Schemas
// ============================================================

export const studentProfileSchema = z.object({
    fullName: z.string().min(2, 'Ad soyad zorunludur'),
    dateOfBirth: z.string().min(1, 'Doğum tarihi zorunludur'),
    gender: z.enum(['male', 'female', 'other']),
    bloodType: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
    disabilityType: z.string().optional(),
    disabilityLevel: z.enum(['mild', 'moderate', 'severe']).optional(),
    emergencyContactName: z.string().min(2, 'Acil durum kişisi zorunludur'),
    emergencyContactPhone: z.string().regex(phoneRegex, 'Geçerli bir telefon numarası girin'),
    parentEmail: emailSchema,
    notes: z.string().max(1000).optional(),
});

export type StudentProfileInput = z.infer<typeof studentProfileSchema>;

// ============================================================
// Schedule Schemas
// ============================================================

export const scheduleSchema = z.object({
    title: z.string().min(2, 'Başlık zorunludur'),
    type: z.enum(['class', 'therapy', 'meeting', 'event', 'break']),
    date: z.string().min(1, 'Tarih zorunludur'),
    startTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Geçerli bir saat girin (HH:MM)'),
    endTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Geçerli bir saat girin (HH:MM)'),
    location: z.string().optional(),
    teacher: z.string().optional(),
    description: z.string().max(500).optional(),
}).refine((data) => {
    const start = data.startTime.split(':').map(Number);
    const end = data.endTime.split(':').map(Number);
    return (end[0] * 60 + end[1]) > (start[0] * 60 + start[1]);
}, {
    message: 'Bitiş saati başlangıç saatinden sonra olmalıdır',
    path: ['endTime'],
});

export type ScheduleInput = z.infer<typeof scheduleSchema>;

// ============================================================
// Attendance Schemas
// ============================================================

export const attendanceSchema = z.object({
    studentId: z.string().min(1, 'Öğrenci seçiniz'),
    checkInTime: z.string().optional(),
    checkOutTime: z.string().optional(),
    status: z.enum(['present', 'absent', 'late', 'excused']),
    verificationMethod: z.enum(['face_recognition', 'manual', 'card', 'qr_code']),
    notes: z.string().max(500).optional(),
});

export type AttendanceInput = z.infer<typeof attendanceSchema>;

// ============================================================
// Contact Form Schema
// ============================================================

export const contactFormSchema = z.object({
    name: z.string().min(2, 'Ad soyad en az 2 karakter olmalıdır'),
    email: emailSchema,
    phone: phoneSchema,
    subject: z.string().min(3, 'Konu en az 3 karakter olmalıdır'),
    message: z.string().min(10, 'Mesaj en az 10 karakter olmalıdır').max(2000, 'Mesaj çok uzun'),
});

export type ContactFormInput = z.infer<typeof contactFormSchema>;

// ============================================================
// Login Schema
// ============================================================

export const loginSchema = z.object({
    identifier: z.string().min(1, 'E-posta veya kullanıcı adı zorunludur'),
    password: z.string().min(1, 'Şifre zorunludur'),
    rememberMe: z.boolean().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
