'use client';

import { useState } from 'react';
import ScheduleCalendar from '@/components/schedule/ScheduleCalendar';

interface ScheduleEvent {
    id: string;
    title: string;
    type: 'class' | 'therapy' | 'meeting' | 'break' | 'event';
    startTime: string;
    endTime: string;
    date: string;
    location?: string;
    teacher?: string;
}

// Mock data
const MOCK_EVENTS: ScheduleEvent[] = [
    // Monday
    { id: '1', title: 'Dil ve Konuşma Terapisi', type: 'therapy', startTime: '09:00', endTime: '10:00', date: '2024-12-16', location: 'Terapi Odası 1', teacher: 'Ayşe Öğretmen' },
    { id: '2', title: 'Matematik Dersi', type: 'class', startTime: '10:30', endTime: '11:30', date: '2024-12-16', location: 'Sınıf A', teacher: 'Mehmet Öğretmen' },
    { id: '3', title: 'Öğle Molası', type: 'break', startTime: '12:00', endTime: '13:00', date: '2024-12-16' },
    { id: '4', title: 'Oyun Terapisi', type: 'therapy', startTime: '14:00', endTime: '15:00', date: '2024-12-16', location: 'Oyun Odası', teacher: 'Zeynep Öğretmen' },

    // Tuesday
    { id: '5', title: 'Türkçe Dersi', type: 'class', startTime: '09:00', endTime: '10:00', date: '2024-12-17', location: 'Sınıf A', teacher: 'Ali Öğretmen' },
    { id: '6', title: 'Sosyal Beceri Grubu', type: 'therapy', startTime: '10:30', endTime: '11:30', date: '2024-12-17', location: 'Grup Odası', teacher: 'Fatma Öğretmen' },
    { id: '7', title: 'Veli Görüşmesi', type: 'meeting', startTime: '15:00', endTime: '16:00', date: '2024-12-17', location: 'Toplantı Odası' },

    // Wednesday
    { id: '8', title: 'Fizyoterapi', type: 'therapy', startTime: '09:30', endTime: '10:30', date: '2024-12-18', location: 'Fizik Tedavi', teacher: 'Dr. Emre' },
    { id: '9', title: 'Müzik Dersi', type: 'class', startTime: '11:00', endTime: '12:00', date: '2024-12-18', location: 'Müzik Odası', teacher: 'Can Öğretmen' },

    // Thursday
    { id: '10', title: 'Ergoterapi', type: 'therapy', startTime: '09:00', endTime: '10:00', date: '2024-12-19', location: 'Ergo Odası', teacher: 'Selin Öğretmen' },
    { id: '11', title: 'Resim Dersi', type: 'class', startTime: '10:30', endTime: '11:30', date: '2024-12-19', location: 'Atölye', teacher: 'Elif Öğretmen' },
    { id: '12', title: 'Ekip Toplantısı', type: 'meeting', startTime: '14:00', endTime: '15:00', date: '2024-12-19', location: 'Toplantı Odası' },

    // Friday
    { id: '13', title: 'Bireysel Eğitim', type: 'class', startTime: '09:00', endTime: '10:00', date: '2024-12-20', location: 'Sınıf B', teacher: 'Hakan Öğretmen' },
    { id: '14', title: 'Yıl Sonu Etkinliği', type: 'event', startTime: '14:00', endTime: '16:00', date: '2024-12-20', location: 'Salon' },
];

export default function ProgramPage() {
    const [events] = useState<ScheduleEvent[]>(MOCK_EVENTS);
    const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleEventClick = (event: ScheduleEvent) => {
        setSelectedEvent(event);
        setIsModalOpen(true);
    };

    const getEventTypeLabel = (type: ScheduleEvent['type']) => {
        const labels = {
            class: '📚 Ders',
            therapy: '🧠 Terapi',
            meeting: '👥 Toplantı',
            break: '☕ Mola',
            event: '🎉 Etkinlik',
        };
        return labels[type];
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">📅 Eğitim Programı</h1>
                            <p className="text-gray-500 text-sm mt-1">Haftalık ve aylık program takvimi</p>
                        </div>
                        <button
                            onClick={() => {
                                setSelectedEvent(null);
                                setIsModalOpen(true);
                            }}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                        >
                            ➕ Yeni Etkinlik
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
                <ScheduleCalendar
                    events={events}
                    onEventClick={handleEventClick}
                    onDateClick={(_date) => {
                        // Date click handler
                    }}
                />
            </div>

            {/* Event Detail/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-lg font-bold text-gray-900">
                                {selectedEvent ? 'Etkinlik Detayı' : 'Yeni Etkinlik'}
                            </h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 text-xl"
                            >
                                ✕
                            </button>
                        </div>

                        {selectedEvent ? (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl">
                                        {selectedEvent.type === 'class' && '📚'}
                                        {selectedEvent.type === 'therapy' && '🧠'}
                                        {selectedEvent.type === 'meeting' && '👥'}
                                        {selectedEvent.type === 'break' && '☕'}
                                        {selectedEvent.type === 'event' && '🎉'}
                                    </span>
                                    <div>
                                        <p className="font-semibold text-lg text-gray-900">{selectedEvent.title}</p>
                                        <p className="text-sm text-gray-500">{getEventTypeLabel(selectedEvent.type)}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                                    <div>
                                        <p className="text-sm text-gray-500">📅 Tarih</p>
                                        <p className="font-medium">{selectedEvent.date}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">⏰ Saat</p>
                                        <p className="font-medium">{selectedEvent.startTime} - {selectedEvent.endTime}</p>
                                    </div>
                                    {selectedEvent.location && (
                                        <div>
                                            <p className="text-sm text-gray-500">📍 Konum</p>
                                            <p className="font-medium">{selectedEvent.location}</p>
                                        </div>
                                    )}
                                    {selectedEvent.teacher && (
                                        <div>
                                            <p className="text-sm text-gray-500">👤 Eğitmen</p>
                                            <p className="font-medium">{selectedEvent.teacher}</p>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-2 pt-4 border-t">
                                    <button
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                    >
                                        Kapat
                                    </button>
                                    <button className="flex-1 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                                        Düzenle
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <form className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Başlık</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="Etkinlik adı"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Tür</label>
                                        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                                            <option value="class">Ders</option>
                                            <option value="therapy">Terapi</option>
                                            <option value="meeting">Toplantı</option>
                                            <option value="event">Etkinlik</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Tarih</label>
                                        <input
                                            type="date"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Başlangıç</label>
                                        <input
                                            type="time"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Bitiş</label>
                                        <input
                                            type="time"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                    >
                                        İptal
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                                    >
                                        Kaydet
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
