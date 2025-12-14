import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    Modal,
    TextInput,
    ScrollView,
    Alert,
    ActivityIndicator,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

interface Appointment {
    id: number;
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
    type: 'in-person' | 'online' | 'phone';
    teacher?: { name: string };
}

const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100',
    confirmed: 'bg-green-100',
    cancelled: 'bg-red-100',
    completed: 'bg-gray-100',
};

const statusLabels: Record<string, string> = {
    pending: 'Beklemede',
    confirmed: 'Onaylandı',
    cancelled: 'İptal',
    completed: 'Tamamlandı',
};

export default function AppointmentsScreen() {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);

    useEffect(() => {
        loadAppointments();
    }, []);

    const loadAppointments = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/appointments`);
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

    const loadSlots = async (date: string) => {
        setLoadingSlots(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/appointments/slots?teacherId=1&date=${date}`);
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

    const handleDateChange = (date: string) => {
        setSelectedDate(date);
        setSelectedSlot(null);
        loadSlots(date);
    };

    const handleBook = async () => {
        if (!selectedDate || !selectedSlot) {
            Alert.alert('Hata', 'Lütfen tarih ve saat seçin');
            return;
        }

        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/appointments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    teacherId: 1,
                    studentId: 1,
                    date: selectedDate,
                    startTime: selectedSlot,
                    type: 'in-person',
                    title: 'Veli Görüşmesi',
                }),
            });
            const data = await res.json();
            if (data.success) {
                setShowModal(false);
                loadAppointments();
                Alert.alert('Başarılı', 'Randevunuz oluşturuldu');
            } else {
                Alert.alert('Hata', data.error);
            }
        } catch (err) {
            Alert.alert('Hata', 'Randevu oluşturulamadı');
        }
    };

    const handleCancel = (id: number) => {
        Alert.alert('İptal Et', 'Randevuyu iptal etmek istiyor musunuz?', [
            { text: 'Hayır', style: 'cancel' },
            {
                text: 'Evet',
                style: 'destructive',
                onPress: async () => {
                    await fetch(`${API_BASE_URL}/api/v1/appointments/${id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'cancel' }),
                    });
                    loadAppointments();
                },
            },
        ]);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'long',
        });
    };

    const renderAppointment = ({ item }: { item: Appointment }) => (
        <View className="bg-white mx-4 mb-3 p-4 rounded-xl shadow-sm">
            <View className="flex-row items-center justify-between">
                <View className="flex-1">
                    <Text className="font-semibold text-gray-800">{item.title}</Text>
                    <View className="flex-row items-center gap-2 mt-1">
                        <FontAwesomeIcon name="calendar" size={12} color="#6b7280" />
                        <Text className="text-sm text-gray-500">{formatDate(item.date)}</Text>
                        <FontAwesomeIcon name="clock-o" size={12} color="#6b7280" />
                        <Text className="text-sm text-gray-500">{item.startTime}</Text>
                    </View>
                    {item.teacher && (
                        <Text className="text-sm text-gray-600 mt-1">{item.teacher.name}</Text>
                    )}
                </View>
                <View className="items-end gap-2">
                    <View className={`px-3 py-1 rounded-full ${statusColors[item.status]}`}>
                        <Text className="text-xs font-medium">{statusLabels[item.status]}</Text>
                    </View>
                    {item.status === 'pending' && (
                        <TouchableOpacity onPress={() => handleCancel(item.id)}>
                            <Text className="text-red-500 text-sm">İptal</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </View>
    );

    return (
        <View className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="bg-orange-500 px-4 py-4 flex-row items-center justify-between">
                <Text className="text-white text-xl font-bold">Randevular</Text>
                <TouchableOpacity onPress={() => setShowModal(true)} className="bg-white/20 px-3 py-2 rounded-lg">
                    <FontAwesomeIcon name="plus" size={18} color="white" />
                </TouchableOpacity>
            </View>

            {/* List */}
            <FlatList
                data={appointments}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderAppointment}
                contentContainerStyle={{ paddingVertical: 16 }}
                refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadAppointments} />}
                ListEmptyComponent={
                    !isLoading ? (
                        <View className="items-center py-12">
                            <FontAwesomeIcon name="calendar-o" size={48} color="#d1d5db" />
                            <Text className="text-gray-400 mt-3">Henüz randevunuz yok</Text>
                        </View>
                    ) : null
                }
            />

            {/* Booking Modal */}
            <Modal visible={showModal} animationType="slide" transparent>
                <View className="flex-1 bg-black/50 justify-end">
                    <View className="bg-white rounded-t-3xl p-6 max-h-[80%]">
                        <View className="flex-row items-center justify-between mb-4">
                            <Text className="text-xl font-bold">Yeni Randevu</Text>
                            <TouchableOpacity onPress={() => setShowModal(false)}>
                                <FontAwesomeIcon name="times" size={24} color="#6b7280" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView>
                            {/* Date Input */}
                            <Text className="text-sm font-medium text-gray-700 mb-2">Tarih</Text>
                            <TextInput
                                placeholder="YYYY-MM-DD"
                                value={selectedDate}
                                onChangeText={handleDateChange}
                                className="border border-gray-200 rounded-xl px-4 py-3 mb-4"
                            />

                            {/* Time Slots */}
                            {selectedDate && (
                                <>
                                    <Text className="text-sm font-medium text-gray-700 mb-2">Saat Seçin</Text>
                                    {loadingSlots ? (
                                        <ActivityIndicator className="py-4" />
                                    ) : availableSlots.length === 0 ? (
                                        <Text className="text-gray-500 py-4">Bu tarihte müsait saat yok</Text>
                                    ) : (
                                        <View className="flex-row flex-wrap gap-2 mb-4">
                                            {availableSlots.map((slot) => (
                                                <TouchableOpacity
                                                    key={slot}
                                                    onPress={() => setSelectedSlot(slot)}
                                                    className={`px-4 py-2 rounded-lg border ${selectedSlot === slot
                                                            ? 'bg-orange-500 border-orange-500'
                                                            : 'border-gray-200'
                                                        }`}
                                                >
                                                    <Text className={selectedSlot === slot ? 'text-white' : 'text-gray-800'}>
                                                        {slot}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    )}
                                </>
                            )}

                            {/* Book Button */}
                            <TouchableOpacity
                                onPress={handleBook}
                                disabled={!selectedDate || !selectedSlot}
                                className={`py-4 rounded-xl mt-4 ${selectedDate && selectedSlot ? 'bg-orange-500' : 'bg-gray-300'
                                    }`}
                            >
                                <Text className="text-white text-center font-semibold">Randevu Al</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
