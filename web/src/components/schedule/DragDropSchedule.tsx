'use client';

import { useState, useRef, useCallback, DragEvent, ReactNode } from 'react';

interface DragItem {
    id: string;
    type: string;
    data: unknown;
}

interface DropZoneProps {
    accept: string[];
    onDrop: (item: DragItem, position: { x: number; y: number }) => void;
    children: ReactNode;
    className?: string;
}

interface DraggableProps {
    id: string;
    type: string;
    data: unknown;
    children: ReactNode;
    className?: string;
    onDragStart?: () => void;
    onDragEnd?: () => void;
}

/**
 * Global drag state
 */
let currentDragItem: DragItem | null = null;

/**
 * Draggable Item Component
 */
export function Draggable({
    id,
    type,
    data,
    children,
    className = '',
    onDragStart,
    onDragEnd,
}: DraggableProps) {
    const [isDragging, setIsDragging] = useState(false);

    const handleDragStart = (e: DragEvent<HTMLDivElement>) => {
        currentDragItem = { id, type, data };
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', id);
        setIsDragging(true);
        onDragStart?.();
    };

    const handleDragEnd = () => {
        currentDragItem = null;
        setIsDragging(false);
        onDragEnd?.();
    };

    return (
        <div
            draggable
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            className={`cursor-grab active:cursor-grabbing ${className} ${isDragging ? 'opacity-50 scale-95' : ''
                } transition-all`}
        >
            {children}
        </div>
    );
}

/**
 * Drop Zone Component
 */
export function DropZone({
    accept,
    onDrop,
    children,
    className = '',
}: DropZoneProps) {
    const [isOver, setIsOver] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const handleDragOver = useCallback(
        (e: DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            if (currentDragItem && accept.includes(currentDragItem.type)) {
                e.dataTransfer.dropEffect = 'move';
                setIsOver(true);
            }
        },
        [accept]
    );

    const handleDragLeave = () => {
        setIsOver(false);
    };

    const handleDrop = useCallback(
        (e: DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            setIsOver(false);

            if (currentDragItem && accept.includes(currentDragItem.type) && ref.current) {
                const rect = ref.current.getBoundingClientRect();
                const position = {
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                };
                onDrop(currentDragItem, position);
            }
        },
        [accept, onDrop]
    );

    return (
        <div
            ref={ref}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`${className} ${isOver ? 'ring-2 ring-blue-500 ring-offset-2 bg-blue-50 dark:bg-blue-900/20' : ''
                } transition-all`}
        >
            {children}
        </div>
    );
}

/**
 * Schedule Event Drag Item
 */
interface ScheduleEvent {
    id: string;
    title: string;
    type: 'class' | 'therapy' | 'meeting' | 'event';
    startTime: string;
    endTime: string;
    day: number; // 0-6 for Sunday-Saturday
}

interface DraggableScheduleEventProps {
    event: ScheduleEvent;
    onMove?: (eventId: string, newDay: number, newTime: string) => void;
}

export function DraggableScheduleEvent({ event }: DraggableScheduleEventProps) {
    const typeColors = {
        class: 'bg-blue-500',
        therapy: 'bg-green-500',
        meeting: 'bg-purple-500',
        event: 'bg-orange-500',
    };

    return (
        <Draggable id={event.id} type="schedule-event" data={event}>
            <div
                className={`${typeColors[event.type]} text-white rounded-lg p-2 text-sm shadow-sm`}
            >
                <p className="font-medium truncate">{event.title}</p>
                <p className="text-xs opacity-80">
                    {event.startTime} - {event.endTime}
                </p>
            </div>
        </Draggable>
    );
}

/**
 * Schedule Grid with Drag & Drop
 */
interface ScheduleGridProps {
    events: ScheduleEvent[];
    onEventMove: (eventId: string, newDay: number, newHour: number) => void;
    startHour?: number;
    endHour?: number;
}

export function ScheduleGrid({
    events,
    onEventMove,
    startHour = 8,
    endHour = 18,
}: ScheduleGridProps) {
    const days = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum'];
    const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);

    const handleDrop = useCallback(
        (item: DragItem, day: number, hour: number) => {
            if (item.type === 'schedule-event') {
                onEventMove(item.id, day, hour);
            }
        },
        [onEventMove]
    );

    const getEventsForSlot = (day: number, hour: number) => {
        return events.filter((e) => {
            const eventHour = parseInt(e.startTime.split(':')[0]);
            return e.day === day && eventHour === hour;
        });
    };

    return (
        <div className="overflow-x-auto">
            <div className="min-w-[600px] grid grid-cols-6 gap-1">
                {/* Header */}
                <div className="bg-gray-100 dark:bg-gray-800 p-2 font-medium text-center">
                    Saat
                </div>
                {days.map((day) => (
                    <div
                        key={day}
                        className="bg-gray-100 dark:bg-gray-800 p-2 font-medium text-center"
                    >
                        {day}
                    </div>
                ))}

                {/* Time slots */}
                {hours.map((hour) => (
                    <>
                        <div
                            key={`hour-${hour}`}
                            className="bg-gray-50 dark:bg-gray-900 p-2 text-sm text-gray-500 text-center"
                        >
                            {hour}:00
                        </div>
                        {days.map((_, dayIndex) => (
                            <DropZone
                                key={`${dayIndex}-${hour}`}
                                accept={['schedule-event']}
                                onDrop={(item) => handleDrop(item, dayIndex, hour)}
                                className="min-h-[60px] bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-1 rounded"
                            >
                                <div className="space-y-1">
                                    {getEventsForSlot(dayIndex, hour).map((event) => (
                                        <DraggableScheduleEvent key={event.id} event={event} />
                                    ))}
                                </div>
                            </DropZone>
                        ))}
                    </>
                ))}
            </div>
        </div>
    );
}

/**
 * Hook for drag and drop state
 */
export function useDragAndDrop<T>() {
    const [items, setItems] = useState<T[]>([]);
    const [draggedItem, setDraggedItem] = useState<T | null>(null);

    const moveItem = useCallback((fromIndex: number, toIndex: number) => {
        setItems((prev) => {
            const newItems = [...prev];
            const [removed] = newItems.splice(fromIndex, 1);
            newItems.splice(toIndex, 0, removed);
            return newItems;
        });
    }, []);

    return {
        items,
        setItems,
        draggedItem,
        setDraggedItem,
        moveItem,
    };
}
