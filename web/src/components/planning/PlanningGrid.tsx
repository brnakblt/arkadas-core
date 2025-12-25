'use client';

/**
 * Planlama Sistemi - Planning Grid Component
 * 
 * Drag-drop weekly schedule planner for special education sessions.
 * Features:
 * - Drag-drop lesson placement
 * - Copy/paste functionality
 * - Real-time validation (rule engine)
 * - Multi-user collaboration (WebSocket)
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
    DndContext,
    DragOverlay,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragEndEvent,
    DragOverEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Types
export interface PlanItem {
    id: string;
    studentId: string;
    studentName: string;
    teacherId: string;
    teacherName: string;
    moduleCode: string;
    moduleName: string;
    sessionType: 'bireysel' | 'grup';
    duration: number; // minutes
    color?: string;
}

export interface TimeSlot {
    day: number; // 0-6 (Monday-Sunday)
    hour: number; // 8-18
    minute: number; // 0 or 30
}

export interface PlannedSession extends PlanItem {
    slot: TimeSlot;
}

export interface PlanningGridProps {
    sessions: PlannedSession[];
    availableItems: PlanItem[];
    onSessionAdd: (item: PlanItem, slot: TimeSlot) => void;
    onSessionMove: (sessionId: string, newSlot: TimeSlot) => void;
    onSessionRemove: (sessionId: string) => void;
    onValidationError?: (errors: ValidationError[]) => void;
    rules?: PlanningRules;
    readOnly?: boolean;
}

export interface ValidationError {
    type: 'student_limit' | 'teacher_limit' | 'overlap' | 'school_hours' | 'module_complete';
    message: string;
    severity: 'error' | 'warning';
    sessionId?: string;
}

export interface PlanningRules {
    studentDailyBireysel: { min: number; max: number };
    studentWeeklyGrup: { min: number; max: number };
    teacherDailyMax: number;
    teacherWeeklyMax: number;
    workingHours: { start: number; end: number };
}

// Default rules from Lila specification
const DEFAULT_RULES: PlanningRules = {
    studentDailyBireysel: { min: 2, max: 2 },
    studentWeeklyGrup: { min: 1, max: 1 },
    teacherDailyMax: 8,
    teacherWeeklyMax: 40,
    workingHours: { start: 8, end: 18 },
};

// Days of the week (Turkish)
const DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
const HOURS = Array.from({ length: 11 }, (_, i) => i + 8); // 08:00 - 18:00

// Droppable time slot component
const DroppableSlot: React.FC<{
    day: number;
    hour: number;
    sessions: PlannedSession[];
    onDrop: (item: PlanItem) => void;
}> = ({ day, hour, sessions, onDrop }) => {
    const slotSessions = sessions.filter(
        (s) => s.slot.day === day && s.slot.hour === hour
    );

    return (
        <div
            className="min-h-[60px] border border-gray-200 dark:border-gray-700 p-1 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            data-day={day}
            data-hour={hour}
        >
            {slotSessions.map((session) => (
                <DraggableSession key={session.id} session={session} />
            ))}
        </div>
    );
};

// Draggable session item component
const DraggableSession: React.FC<{ session: PlannedSession }> = ({ session }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: session.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        backgroundColor: session.color || (session.sessionType === 'bireysel' ? '#3b82f6' : '#10b981'),
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="p-2 rounded text-white text-xs cursor-move mb-1"
        >
            <div className="font-semibold truncate">{session.studentName}</div>
            <div className="truncate opacity-80">{session.moduleName}</div>
            <div className="flex justify-between mt-1 text-[10px] opacity-70">
                <span>{session.teacherName}</span>
                <span>{session.duration}dk</span>
            </div>
        </div>
    );
};

// Available items sidebar
const AvailableItemsSidebar: React.FC<{
    items: PlanItem[];
}> = ({ items }) => {
    return (
        <div className="w-64 bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
            <h3 className="font-semibold mb-3 text-gray-700 dark:text-gray-300">
                Planlanacak Dersler
            </h3>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {items.map((item) => (
                    <div
                        key={item.id}
                        draggable
                        className="p-3 bg-white dark:bg-gray-800 rounded shadow-sm cursor-move hover:shadow-md transition-shadow border-l-4"
                        style={{
                            borderLeftColor: item.sessionType === 'bireysel' ? '#3b82f6' : '#10b981',
                        }}
                    >
                        <div className="font-medium text-sm">{item.studentName}</div>
                        <div className="text-xs text-gray-500">{item.moduleName}</div>
                        <div className="flex justify-between mt-1 text-xs text-gray-400">
                            <span>{item.teacherName}</span>
                            <span className="capitalize">{item.sessionType}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Main Planning Grid Component
export const PlanningGrid: React.FC<PlanningGridProps> = ({
    sessions,
    availableItems,
    onSessionAdd,
    onSessionMove,
    onSessionRemove,
    onValidationError,
    rules = DEFAULT_RULES,
    readOnly = false,
}) => {
    const [activeId, setActiveId] = useState<string | null>(null);
    const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Validate planning against rules
    const validatePlanning = useCallback((currentSessions: PlannedSession[]): ValidationError[] => {
        const errors: ValidationError[] = [];

        // Group sessions by student and teacher
        const byStudent: Record<string, PlannedSession[]> = {};
        const byTeacher: Record<string, PlannedSession[]> = {};

        currentSessions.forEach((session) => {
            if (!byStudent[session.studentId]) byStudent[session.studentId] = [];
            byStudent[session.studentId].push(session);

            if (!byTeacher[session.teacherId]) byTeacher[session.teacherId] = [];
            byTeacher[session.teacherId].push(session);
        });

        // Check student limits
        Object.entries(byStudent).forEach(([studentId, studentSessions]) => {
            const daily: Record<number, number> = {};
            let weeklyGrup = 0;

            studentSessions.forEach((s) => {
                if (!daily[s.slot.day]) daily[s.slot.day] = 0;
                if (s.sessionType === 'bireysel') daily[s.slot.day]++;
                if (s.sessionType === 'grup') weeklyGrup++;
            });

            Object.entries(daily).forEach(([day, count]) => {
                if (count > rules.studentDailyBireysel.max) {
                    errors.push({
                        type: 'student_limit',
                        message: `Öğrenci günlük bireysel ders limiti aşıldı (${count}/${rules.studentDailyBireysel.max})`,
                        severity: 'error',
                    });
                }
            });
        });

        // Check teacher limits
        Object.entries(byTeacher).forEach(([teacherId, teacherSessions]) => {
            const daily: Record<number, number> = {};
            let weeklyTotal = 0;

            teacherSessions.forEach((s) => {
                if (!daily[s.slot.day]) daily[s.slot.day] = 0;
                daily[s.slot.day]++;
                weeklyTotal++;
            });

            Object.entries(daily).forEach(([day, count]) => {
                if (count > rules.teacherDailyMax) {
                    errors.push({
                        type: 'teacher_limit',
                        message: `Öğretmen günlük ders limiti aşıldı (${count}/${rules.teacherDailyMax})`,
                        severity: 'error',
                    });
                }
            });

            if (weeklyTotal > rules.teacherWeeklyMax) {
                errors.push({
                    type: 'teacher_limit',
                    message: `Öğretmen haftalık ders limiti aşıldı (${weeklyTotal}/${rules.teacherWeeklyMax})`,
                    severity: 'error',
                });
            }
        });

        return errors;
    }, [rules]);

    // Handle drag start
    const handleDragStart = useCallback((event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    }, []);

    // Handle drag end
    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const overEl = document.querySelector(`[data-day][data-hour]`);
        if (overEl) {
            const day = parseInt(overEl.getAttribute('data-day') || '0');
            const hour = parseInt(overEl.getAttribute('data-hour') || '8');

            const existingSession = sessions.find((s) => s.id === active.id);
            if (existingSession) {
                onSessionMove(active.id as string, { day, hour, minute: 0 });
            }
        }

        // Validate after move
        const errors = validatePlanning(sessions);
        setValidationErrors(errors);
        onValidationError?.(errors);
    }, [sessions, onSessionMove, validatePlanning, onValidationError]);

    const activeSession = useMemo(
        () => sessions.find((s) => s.id === activeId),
        [sessions, activeId]
    );

    return (
        <div className="flex gap-4">
            {/* Available Items Sidebar */}
            {!readOnly && <AvailableItemsSidebar items={availableItems} />}

            {/* Main Grid */}
            <div className="flex-1">
                {/* Validation Errors */}
                {validationErrors.length > 0 && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <h4 className="font-semibold text-red-600 dark:text-red-400 mb-2">
                            Uyarılar
                        </h4>
                        <ul className="text-sm text-red-600 dark:text-red-400 space-y-1">
                            {validationErrors.map((error, i) => (
                                <li key={i}>• {error.message}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Grid */}
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr>
                                    <th className="p-2 bg-gray-100 dark:bg-gray-800 border">Saat</th>
                                    {DAYS.map((day, i) => (
                                        <th
                                            key={i}
                                            className="p-2 bg-gray-100 dark:bg-gray-800 border min-w-[150px]"
                                        >
                                            {day}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {HOURS.map((hour) => (
                                    <tr key={hour}>
                                        <td className="p-2 bg-gray-50 dark:bg-gray-800 border text-center font-medium">
                                            {hour.toString().padStart(2, '0')}:00
                                        </td>
                                        {DAYS.map((_, dayIndex) => (
                                            <td key={dayIndex} className="p-0 border">
                                                <SortableContext
                                                    items={sessions.filter(
                                                        (s) => s.slot.day === dayIndex && s.slot.hour === hour
                                                    )}
                                                    strategy={rectSortingStrategy}
                                                >
                                                    <DroppableSlot
                                                        day={dayIndex}
                                                        hour={hour}
                                                        sessions={sessions}
                                                        onDrop={(item) =>
                                                            onSessionAdd(item, { day: dayIndex, hour, minute: 0 })
                                                        }
                                                    />
                                                </SortableContext>
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <DragOverlay>
                        {activeSession && <DraggableSession session={activeSession} />}
                    </DragOverlay>
                </DndContext>
            </div>
        </div>
    );
};

export default PlanningGrid;
