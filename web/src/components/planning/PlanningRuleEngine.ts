'use client';

/**
 * Planning Rules Engine
 * 
 * Validates planning against configurable rules:
 * - Student daily/weekly limits
 * - Teacher daily/weekly limits
 * - School hours conflicts
 * - Module completion warnings
 */

import { PlannedSession, PlanningRules, ValidationError } from './PlanningGrid';

export interface RuleEngineConfig {
    rules: PlanningRules;
    studentSchoolHours?: Record<string, { start: number; end: number; days: number[] }>;
    moduleCompletionData?: Record<string, { used: number; total: number }>;
}

export class PlanningRuleEngine {
    private config: RuleEngineConfig;

    constructor(config: RuleEngineConfig) {
        this.config = config;
    }

    /**
     * Validate all sessions against rules
     */
    validate(sessions: PlannedSession[]): ValidationError[] {
        const errors: ValidationError[] = [];

        errors.push(...this.validateStudentLimits(sessions));
        errors.push(...this.validateTeacherLimits(sessions));
        errors.push(...this.validateOverlaps(sessions));
        errors.push(...this.validateSchoolHours(sessions));
        errors.push(...this.validateModuleCompletion(sessions));

        return errors;
    }

    /**
     * Check student daily/weekly limits
     */
    private validateStudentLimits(sessions: PlannedSession[]): ValidationError[] {
        const errors: ValidationError[] = [];
        const { rules } = this.config;

        // Group by student
        const byStudent = this.groupBy(sessions, 'studentId');

        Object.entries(byStudent).forEach(([_studentId, studentSessions]) => {
            // Daily bireysel count
            const dailyBireysel: Record<number, number> = {};
            let weeklyGrup = 0;

            studentSessions.forEach((s) => {
                if (!dailyBireysel[s.slot.day]) dailyBireysel[s.slot.day] = 0;
                if (s.sessionType === 'bireysel') dailyBireysel[s.slot.day]++;
                if (s.sessionType === 'grup') weeklyGrup++;
            });

            // Check daily bireysel limits
            Object.entries(dailyBireysel).forEach(([_day, count]) => {
                if (count < rules.studentDailyBireysel.min) {
                    errors.push({
                        type: 'student_limit',
                        message: `${studentSessions[0]?.studentName}: Günlük bireysel ders yetersiz (${count}/${rules.studentDailyBireysel.min})`,
                        severity: 'warning',
                    });
                }
                if (count > rules.studentDailyBireysel.max) {
                    errors.push({
                        type: 'student_limit',
                        message: `${studentSessions[0]?.studentName}: Günlük bireysel ders limiti aşıldı (${count}/${rules.studentDailyBireysel.max})`,
                        severity: 'error',
                    });
                }
            });

            // Check weekly grup limits
            if (weeklyGrup < rules.studentWeeklyGrup.min) {
                errors.push({
                    type: 'student_limit',
                    message: `${studentSessions[0]?.studentName}: Haftalık grup dersi yetersiz (${weeklyGrup}/${rules.studentWeeklyGrup.min})`,
                    severity: 'warning',
                });
            }
            if (weeklyGrup > rules.studentWeeklyGrup.max) {
                errors.push({
                    type: 'student_limit',
                    message: `${studentSessions[0]?.studentName}: Haftalık grup dersi limiti aşıldı`,
                    severity: 'error',
                });
            }
        });

        return errors;
    }

    /**
     * Check teacher daily/weekly limits
     */
    private validateTeacherLimits(sessions: PlannedSession[]): ValidationError[] {
        const errors: ValidationError[] = [];
        const { rules } = this.config;

        const byTeacher = this.groupBy(sessions, 'teacherId');

        Object.entries(byTeacher).forEach(([_teacherId, teacherSessions]) => {
            const daily: Record<number, number> = {};
            let weeklyTotal = 0;

            teacherSessions.forEach((s) => {
                if (!daily[s.slot.day]) daily[s.slot.day] = 0;
                daily[s.slot.day]++;
                weeklyTotal++;
            });

            // Check daily limit
            Object.entries(daily).forEach(([_day, count]) => {
                if (count > rules.teacherDailyMax) {
                    errors.push({
                        type: 'teacher_limit',
                        message: `${teacherSessions[0]?.teacherName}: Günlük ${count} ders (max: ${rules.teacherDailyMax})`,
                        severity: 'error',
                    });
                }
            });

            // Check weekly limit
            if (weeklyTotal > rules.teacherWeeklyMax) {
                errors.push({
                    type: 'teacher_limit',
                    message: `${teacherSessions[0]?.teacherName}: Haftalık ${weeklyTotal} ders (max: ${rules.teacherWeeklyMax})`,
                    severity: 'error',
                });
            }
        });

        return errors;
    }

    /**
     * Check for scheduling overlaps
     */
    private validateOverlaps(sessions: PlannedSession[]): ValidationError[] {
        const errors: ValidationError[] = [];

        // Check teacher overlaps
        const byTeacher = this.groupBy(sessions, 'teacherId');
        Object.entries(byTeacher).forEach(([_, teacherSessions]) => {
            for (let i = 0; i < teacherSessions.length; i++) {
                for (let j = i + 1; j < teacherSessions.length; j++) {
                    if (this.sessionsOverlap(teacherSessions[i], teacherSessions[j])) {
                        errors.push({
                            type: 'overlap',
                            message: `Çakışma: ${teacherSessions[i].teacherName} aynı anda iki derste`,
                            severity: 'error',
                            sessionId: teacherSessions[i].id,
                        });
                    }
                }
            }
        });

        // Check student overlaps
        const byStudent = this.groupBy(sessions, 'studentId');
        Object.entries(byStudent).forEach(([_, studentSessions]) => {
            for (let i = 0; i < studentSessions.length; i++) {
                for (let j = i + 1; j < studentSessions.length; j++) {
                    if (this.sessionsOverlap(studentSessions[i], studentSessions[j])) {
                        errors.push({
                            type: 'overlap',
                            message: `Çakışma: ${studentSessions[i].studentName} aynı anda iki derste`,
                            severity: 'error',
                            sessionId: studentSessions[i].id,
                        });
                    }
                }
            }
        });

        return errors;
    }

    /**
     * Check school hours conflicts
     */
    private validateSchoolHours(sessions: PlannedSession[]): ValidationError[] {
        const errors: ValidationError[] = [];
        const { studentSchoolHours } = this.config;

        if (!studentSchoolHours) return errors;

        sessions.forEach((session) => {
            const schoolHours = studentSchoolHours[session.studentId];
            if (schoolHours && schoolHours.days.includes(session.slot.day)) {
                if (
                    session.slot.hour >= schoolHours.start &&
                    session.slot.hour < schoolHours.end
                ) {
                    errors.push({
                        type: 'school_hours',
                        message: `${session.studentName}: Okul saatleri ile çakışma`,
                        severity: 'error',
                        sessionId: session.id,
                    });
                }
            }
        });

        return errors;
    }

    /**
     * Check module completion warnings
     */
    private validateModuleCompletion(sessions: PlannedSession[]): ValidationError[] {
        const errors: ValidationError[] = [];
        const { moduleCompletionData } = this.config;

        if (!moduleCompletionData) return errors;

        const byModule: Record<string, PlannedSession[]> = {};
        sessions.forEach((s) => {
            const key = `${s.studentId}-${s.moduleCode}`;
            if (!byModule[key]) byModule[key] = [];
            byModule[key].push(s);
        });

        Object.entries(byModule).forEach(([key, moduleSessions]) => {
            const completion = moduleCompletionData[key];
            if (completion) {
                const plannedHours = moduleSessions.reduce((sum, s) => sum + s.duration / 60, 0);
                const remaining = completion.total - completion.used;

                if (plannedHours > remaining) {
                    errors.push({
                        type: 'module_complete',
                        message: `${moduleSessions[0].studentName} - ${moduleSessions[0].moduleName}: Modül süresi dolacak!`,
                        severity: 'warning',
                    });
                }
            }
        });

        return errors;
    }

    /**
     * Helper: Check if two sessions overlap
     */
    private sessionsOverlap(a: PlannedSession, b: PlannedSession): boolean {
        if (a.slot.day !== b.slot.day) return false;

        const aStart = a.slot.hour * 60 + a.slot.minute;
        const aEnd = aStart + a.duration;
        const bStart = b.slot.hour * 60 + b.slot.minute;
        const bEnd = bStart + b.duration;

        return aStart < bEnd && bStart < aEnd;
    }

    /**
     * Helper: Group by key
     */
    private groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
        return arr.reduce((acc, item) => {
            const k = String(item[key]);
            if (!acc[k]) acc[k] = [];
            acc[k].push(item);
            return acc;
        }, {} as Record<string, T[]>);
    }
}

export default PlanningRuleEngine;
