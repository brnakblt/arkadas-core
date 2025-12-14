/**
 * AppointmentBooking Component
 * UI for booking and managing appointments
 */

"use client";

import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCalendarAlt,
    faClock,
    faUser,
    faVideo,
    faPhone,
    faSpinner,
    faCheck,
    faTimes,
    faPlus,
} from '@fortawesome/free-solid-svg-icons';

interface Appointment {
    id: number;
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
    type: 'in-person' | 'online' | 'phone';
    student?: { name: string };
    teacher?: { name: string };
}

interface Teacher {
    id: number;
    name: string;
}

const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    completed: 'bg-gray-100 text-gray-800',
};

const statusLabels = {
    pending: 'Beklemede',
    confirmed: 'Onaylandı',
    cancelled: 'İptal',
    completed: 'Tamamlandı',
};

const typeIcons = {
    'in-person': faUser,
    'online': faVideo,
    'phone': faPhone,
};

const AppointmentBooking: React.FC = () => {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTeacher, setSelectedTeacher] = useState<number | null>(null);
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [bookingType, setBookingType] = useState<'in-person' | 'online' | 'phone'>('in-person');
    const [error, setError] = useState<string | null>(null);

    // Mock teachers - replace with API call
    const teachers: Teacher[] = [
        { id: 1, name: 'Ayşe Öğretmen' },
        { id: 2, name: 'Mehmet Öğretmen' },
        { id: 3, name: 'Zeynep Öğretmen' },
    ];

    useEffect(() => {
        loadAppointments();
    }, []);

    const loadAppointments = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/v1/appointments');
            const data = await res.json();
            if (data.success) {
                setAppointments(data.data || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const loadAvailableSlots = async () => {
        if (!selectedTeacher || !selectedDate) return;

        setLoadingSlots(true);
        try {
            const res = await fetch(
                `/api/v1/appointments/slots?teacherId=${selectedTeacher}&date=${selectedDate}`
            );
            const data = await res.json();
            if (data.success) {
                setAvailableSlots(data.data.slots || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingSlots(false);
        }
    };

    useEffect(() => {
        if (selectedTeacher && selectedDate) {
            loadAvailableSlots();
        }
    }, [selectedTeacher, selectedDate]);

    const handleBook = async () => {
        if (!selectedTeacher || !selectedDate || !selectedSlot) {
            setError('Lütfen tüm alanları doldurun');
            return;
        }

        try {
            const res = await fetch('/api/v1/appointments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    teacherId: selectedTeacher,
                    studentId: 1, // TODO: Get from user context
                    date: selectedDate,
                    startTime: selectedSlot,
                    type: bookingType,
                    title: 'Veli Görüşmesi',
                }),
            });

            const data = await res.json();
            if (data.success) {
                setShowBookingModal(false);
                loadAppointments();
                resetForm();
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError('Randevu oluşturulamadı');
        }
    };

    const handleCancel = async (id: number) => {
        if (!confirm('Randevuyu iptal etmek istediğinize emin misiniz?')) return;

        try {
            await fetch(`/api/v1/appointments/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'cancel' }),
            });
            loadAppointments();
        } catch (err) {
            console.error(err);
        }
    };

    const resetForm = () => {
        setSelectedDate('');
        setSelectedTeacher(null);
        setSelectedSlot(null);
        setAvailableSlots([]);
        setError(null);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('tr-TR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
        });
    };

    const getMinDate = () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Randevularım</h2>
                    <p className="text-gray-500">Öğretmen görüşme randevularınızı yönetin</p>
                </div>
                <button
                    onClick={() => setShowBookingModal(true)}
                    className="px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-2"
                >
                    <FontAwesomeIcon icon={faPlus} />
                    Yeni Randevu
                </button>
            </div>

            {/* Appointments List */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center">
                        <FontAwesomeIcon icon={faSpinner} className="animate-spin text-2xl text-gray-400" />
                    </div>
                ) : appointments.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">
                        <FontAwesomeIcon icon={faCalendarAlt} className="text-4xl mb-3" />
                        <p>Henüz randevunuz yok</p>
                    </div>
                ) : (
                    <div className="divide-y">
                        {appointments.map((apt) => (
                            <div key={apt.id} className="p-4 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                                            <FontAwesomeIcon icon={typeIcons[apt.type]} className="text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-800">{apt.title}</h3>
                                            <div className="flex items-center gap-3 text-sm text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <FontAwesomeIcon icon={faCalendarAlt} />
                                                    {formatDate(apt.date)}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <FontAwesomeIcon icon={faClock} />
                                                    {apt.startTime} - {apt.endTime}
                                                </span>
                                            </div>
                                            {apt.teacher && (
                                                <p className="text-sm text-gray-600 mt-1">
                                                    Öğretmen: {apt.teacher.name}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[apt.status]}`}>
                                            {statusLabels[apt.status]}
                                        </span>
                                        {apt.status === 'pending' && (
                                            <button
                                                onClick={() => handleCancel(apt.id)}
                                                className="text-red-500 hover:text-red-700 p-2"
                                                title="İptal Et"
                                            >
                                                <FontAwesomeIcon icon={faTimes} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Booking Modal */}
            {showBookingModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-lg">
                        <h3 className="text-xl font-semibold mb-4">Yeni Randevu Al</h3>

                        {error && (
                            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg">{error}</div>
                        )}

                        {/* Teacher Selection */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Öğretmen Seçin
                            </label>
                            <select
                                value={selectedTeacher || ''}
                                onChange={(e) => setSelectedTeacher(Number(e.target.value))}
                                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary/20"
                            >
                                <option value="">Seçiniz...</option>
                                {teachers.map((t) => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Date Selection */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tarih Seçin
                            </label>
                            <input
                                type="date"
                                value={selectedDate}
                                min={getMinDate()}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary/20"
                            />
                        </div>

                        {/* Time Slots */}
                        {selectedTeacher && selectedDate && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Saat Seçin
                                </label>
                                {loadingSlots ? (
                                    <div className="text-center py-4">
                                        <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                                    </div>
                                ) : availableSlots.length === 0 ? (
                                    <p className="text-gray-500 text-sm">Bu tarihte müsait saat yok</p>
                                ) : (
                                    <div className="grid grid-cols-4 gap-2">
                                        {availableSlots.map((slot) => (
                                            <button
                                                key={slot}
                                                onClick={() => setSelectedSlot(slot)}
                                                className={`px-3 py-2 rounded-lg text-sm border transition-colors ${selectedSlot === slot
                                                        ? 'bg-primary text-white border-primary'
                                                        : 'hover:border-primary'
                                                    }`}
                                            >
                                                {slot}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Meeting Type */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Görüşme Türü
                            </label>
                            <div className="flex gap-3">
                                {[
                                    { value: 'in-person', label: 'Yüz Yüze', icon: faUser },
                                    { value: 'online', label: 'Online', icon: faVideo },
                                    { value: 'phone', label: 'Telefon', icon: faPhone },
                                ].map((type) => (
                                    <button
                                        key={type.value}
                                        onClick={() => setBookingType(type.value as any)}
                                        className={`flex-1 px-3 py-2 rounded-lg border flex items-center justify-center gap-2 transition-colors ${bookingType === type.value
                                                ? 'bg-primary text-white border-primary'
                                                : 'hover:border-primary'
                                            }`}
                                    >
                                        <FontAwesomeIcon icon={type.icon} />
                                        {type.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => { setShowBookingModal(false); resetForm(); }}
                                className="flex-1 px-4 py-3 border rounded-xl hover:bg-gray-50"
                            >
                                İptal
                            </button>
                            <button
                                onClick={handleBook}
                                disabled={!selectedTeacher || !selectedDate || !selectedSlot}
                                className="flex-1 px-4 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50"
                            >
                                Randevu Al
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AppointmentBooking;
