import { describe, it, expect } from 'vitest';
import {
    userCreateSchema,
    loginSchema,
    contactFormSchema,
    scheduleSchema,
    phoneSchema,
    emailSchema,
} from '@/lib/validations';

describe('Validation Schemas', () => {
    describe('emailSchema', () => {
        it('accepts valid email', () => {
            expect(() => emailSchema.parse('test@example.com')).not.toThrow();
        });

        it('rejects invalid email', () => {
            expect(() => emailSchema.parse('invalid')).toThrow();
        });
    });

    describe('phoneSchema', () => {
        it('accepts valid Turkish phone', () => {
            expect(() => phoneSchema.parse('05551234567')).not.toThrow();
            expect(() => phoneSchema.parse('+905551234567')).not.toThrow();
        });

        it('accepts empty string', () => {
            expect(() => phoneSchema.parse('')).not.toThrow();
        });

        it('rejects invalid phone', () => {
            expect(() => phoneSchema.parse('123')).toThrow();
        });
    });

    describe('userCreateSchema', () => {
        const validUser = {
            fullName: 'Test User',
            email: 'test@example.com',
            username: 'testuser',
            password: 'password123',
            confirmPassword: 'password123',
            role: 'teacher' as const,
            phone: '05551234567',
        };

        it('accepts valid user data', () => {
            expect(() => userCreateSchema.parse(validUser)).not.toThrow();
        });

        it('rejects short password', () => {
            expect(() =>
                userCreateSchema.parse({ ...validUser, password: '123', confirmPassword: '123' })
            ).toThrow();
        });

        it('rejects mismatched passwords', () => {
            expect(() =>
                userCreateSchema.parse({ ...validUser, confirmPassword: 'different' })
            ).toThrow();
        });

        it('rejects invalid username characters', () => {
            expect(() =>
                userCreateSchema.parse({ ...validUser, username: 'Test User' })
            ).toThrow();
        });
    });

    describe('loginSchema', () => {
        it('accepts valid login', () => {
            expect(() =>
                loginSchema.parse({ identifier: 'user@test.com', password: 'pass123' })
            ).not.toThrow();
        });

        it('rejects empty identifier', () => {
            expect(() => loginSchema.parse({ identifier: '', password: 'pass' })).toThrow();
        });
    });

    describe('scheduleSchema', () => {
        const validSchedule = {
            title: 'Test Ders',
            type: 'class' as const,
            date: '2024-12-15',
            startTime: '09:00',
            endTime: '10:00',
            location: 'Sınıf A',
        };

        it('accepts valid schedule', () => {
            expect(() => scheduleSchema.parse(validSchedule)).not.toThrow();
        });

        it('rejects end time before start time', () => {
            expect(() =>
                scheduleSchema.parse({ ...validSchedule, startTime: '10:00', endTime: '09:00' })
            ).toThrow();
        });

        it('rejects invalid time format', () => {
            expect(() =>
                scheduleSchema.parse({ ...validSchedule, startTime: '25:00' })
            ).toThrow();
        });
    });

    describe('contactFormSchema', () => {
        it('accepts valid contact form', () => {
            expect(() =>
                contactFormSchema.parse({
                    name: 'Test',
                    email: 'test@example.com',
                    phone: '05551234567',
                    subject: 'Konu',
                    message: 'Bu bir test mesajıdır.',
                })
            ).not.toThrow();
        });

        it('rejects short message', () => {
            expect(() =>
                contactFormSchema.parse({
                    name: 'Test',
                    email: 'test@example.com',
                    subject: 'Konu',
                    message: 'Kısa',
                })
            ).toThrow();
        });
    });
});
