'use client';

import { useState, useMemo } from 'react';

interface ScheduleEvent {
    id: string;
    title: string;
    type: 'class' | 'therapy' | 'meeting' | 'break' | 'event';
    startTime: string;
    endTime: string;
    date: string;
    location?: string;
    teacher?: string;
    color?: string;
}

interface ScheduleCalendarProps {
    events: ScheduleEvent[];
    onEventClick?: (event: ScheduleEvent) => void;
    onDateClick?: (date: Date) => void;
}

const DAYS_TR = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
const MONTHS_TR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

const EVENT_COLORS = {
    class: 'bg-blue-100 border-blue-400 text-blue-800',
    therapy: 'bg-purple-100 border-purple-400 text-purple-800',
    meeting: 'bg-yellow-100 border-yellow-400 text-yellow-800',
    break: 'bg-gray-100 border-gray-400 text-gray-600',
    event: 'bg-green-100 border-green-400 text-green-800',
};

export default function ScheduleCalendar({ events, onEventClick, onDateClick }: ScheduleCalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState<'week' | 'month'>('week');

    // Get week dates
    const weekDates = useMemo(() => {
        const dates: Date[] = [];
        const startOfWeek = new Date(currentDate);
        const day = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
        startOfWeek.setDate(diff);

        for (let i = 0; i < 7; i++) {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + i);
            dates.push(date);
        }
        return dates;
    }, [currentDate]);

    // Get month dates
    const monthDates = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const dates: Date[] = [];

        // Pad start of month
        const startPadding = (firstDay.getDay() + 6) % 7;
        for (let i = startPadding - 1; i >= 0; i--) {
            const date = new Date(firstDay);
            date.setDate(date.getDate() - i - 1);
            dates.push(date);
        }

        // Days of month
        for (let i = 1; i <= lastDay.getDate(); i++) {
            dates.push(new Date(year, month, i));
        }

        // Pad end of month
        const endPadding = 42 - dates.length;
        for (let i = 1; i <= endPadding; i++) {
            dates.push(new Date(year, month + 1, i));
        }

        return dates;
    }, [currentDate]);

    const navigateWeek = (direction: number) => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + direction * 7);
        setCurrentDate(newDate);
    };

    const navigateMonth = (direction: number) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + direction);
        setCurrentDate(newDate);
    };

    const getEventsForDate = (date: Date) => {
        const dateStr = date.toISOString().split('T')[0];
        return events.filter(e => e.date === dateStr);
    };

    const formatDateStr = (date: Date) => date.toISOString().split('T')[0];
    const isToday = (date: Date) => formatDateStr(date) === formatDateStr(new Date());
    const isCurrentMonth = (date: Date) => date.getMonth() === currentDate.getMonth();

    return (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold text-gray-900">
                        {view === 'week'
                            ? `${weekDates[0].getDate()} - ${weekDates[6].getDate()} ${MONTHS_TR[currentDate.getMonth()]} ${currentDate.getFullYear()}`
                            : `${MONTHS_TR[currentDate.getMonth()]} ${currentDate.getFullYear()}`
                        }
                    </h2>
                    <div className="flex gap-1">
                        <button
                            onClick={() => view === 'week' ? navigateWeek(-1) : navigateMonth(-1)}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            ←
                        </button>
                        <button
                            onClick={() => setCurrentDate(new Date())}
                            className="px-3 py-1 rounded-lg bg-blue-100 text-blue-700 font-medium hover:bg-blue-200 transition-colors"
                        >
                            Bugün
                        </button>
                        <button
                            onClick={() => view === 'week' ? navigateWeek(1) : navigateMonth(1)}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            →
                        </button>
                    </div>
                </div>

                <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => setView('week')}
                        className={`px-3 py-1.5 rounded font-medium transition-colors ${view === 'week' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        Hafta
                    </button>
                    <button
                        onClick={() => setView('month')}
                        className={`px-3 py-1.5 rounded font-medium transition-colors ${view === 'month' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        Ay
                    </button>
                </div>
            </div>

            {/* Week View */}
            {view === 'week' && (
                <div className="grid grid-cols-7">
                    {/* Day Headers */}
                    {weekDates.map((date, index) => (
                        <div
                            key={index}
                            className={`p-3 text-center border-b ${isToday(date) ? 'bg-blue-50' : ''}`}
                        >
                            <p className="text-sm text-gray-500">{DAYS_TR[index]}</p>
                            <p className={`text-lg font-semibold ${isToday(date) ? 'text-blue-600' : 'text-gray-900'}`}>
                                {date.getDate()}
                            </p>
                        </div>
                    ))}

                    {/* Day Content */}
                    {weekDates.map((date, index) => {
                        const dayEvents = getEventsForDate(date);
                        return (
                            <div
                                key={`content-${index}`}
                                onClick={() => onDateClick?.(date)}
                                className={`min-h-[200px] p-2 border-r border-b cursor-pointer hover:bg-gray-50 transition-colors ${isToday(date) ? 'bg-blue-50/50' : ''
                                    } ${index === 6 ? 'border-r-0' : ''}`}
                            >
                                <div className="space-y-1">
                                    {dayEvents.map(event => (
                                        <div
                                            key={event.id}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEventClick?.(event);
                                            }}
                                            className={`p-2 rounded border-l-4 cursor-pointer hover:shadow-md transition-shadow ${EVENT_COLORS[event.type]
                                                }`}
                                        >
                                            <p className="font-medium text-sm truncate">{event.title}</p>
                                            <p className="text-xs opacity-75">{event.startTime} - {event.endTime}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Month View */}
            {view === 'month' && (
                <div className="grid grid-cols-7">
                    {/* Day Headers */}
                    {DAYS_TR.map((day, index) => (
                        <div key={index} className="p-3 text-center border-b bg-gray-50">
                            <p className="text-sm font-medium text-gray-700">{day.slice(0, 3)}</p>
                        </div>
                    ))}

                    {/* Calendar Days */}
                    {monthDates.map((date, index) => {
                        const dayEvents = getEventsForDate(date);
                        return (
                            <div
                                key={index}
                                onClick={() => onDateClick?.(date)}
                                className={`min-h-[100px] p-2 border-r border-b cursor-pointer transition-colors ${isToday(date)
                                        ? 'bg-blue-50'
                                        : isCurrentMonth(date)
                                            ? 'bg-white hover:bg-gray-50'
                                            : 'bg-gray-50/50 text-gray-400'
                                    } ${(index + 1) % 7 === 0 ? 'border-r-0' : ''}`}
                            >
                                <p className={`text-sm font-medium ${isToday(date) ? 'text-blue-600' : ''
                                    }`}>
                                    {date.getDate()}
                                </p>
                                <div className="mt-1 space-y-0.5">
                                    {dayEvents.slice(0, 3).map(event => (
                                        <div
                                            key={event.id}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEventClick?.(event);
                                            }}
                                            className={`px-1.5 py-0.5 rounded text-xs truncate ${EVENT_COLORS[event.type]
                                                }`}
                                        >
                                            {event.title}
                                        </div>
                                    ))}
                                    {dayEvents.length > 3 && (
                                        <p className="text-xs text-gray-500">+{dayEvents.length - 3} daha</p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Legend */}
            <div className="px-6 py-3 border-t bg-gray-50 flex items-center gap-4">
                <span className="text-sm text-gray-500">Etkinlik Türleri:</span>
                {Object.entries(EVENT_COLORS).map(([type, color]) => (
                    <div key={type} className="flex items-center gap-1">
                        <div className={`w-3 h-3 rounded ${color.split(' ')[0]}`} />
                        <span className="text-sm text-gray-600 capitalize">
                            {type === 'class' ? 'Ders' :
                                type === 'therapy' ? 'Terapi' :
                                    type === 'meeting' ? 'Toplantı' :
                                        type === 'break' ? 'Mola' : 'Etkinlik'}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
