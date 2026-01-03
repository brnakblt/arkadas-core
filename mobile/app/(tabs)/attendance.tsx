/**
 * Attendance Screen - Face Recognition Check-in
 * The killer mobile feature!
 */

import { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Animated,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';

type CheckInStatus = 'ready' | 'scanning' | 'success' | 'error';

interface Student {
    id: string;
    name: string;
    photo?: string;
}

export default function AttendanceScreen() {
    const [permission, requestPermission] = useCameraPermissions();
    const [facing, setFacing] = useState<CameraType>('front');
    const [status, setStatus] = useState<CheckInStatus>('ready');
    const [checkedIn, setCheckedIn] = useState<Student[]>([]);
    const [lastScanned, setLastScanned] = useState<Student | null>(null);

    const pulseAnim = useRef(new Animated.Value(1)).current;
    const successAnim = useRef(new Animated.Value(0)).current;

    // Pulse animation for scanning
    useEffect(() => {
        if (status === 'scanning') {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.1,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } else {
            pulseAnim.setValue(1);
        }
    }, [status]);

    // Success animation
    useEffect(() => {
        if (status === 'success') {
            Animated.spring(successAnim, {
                toValue: 1,
                friction: 3,
                useNativeDriver: true,
            }).start();

            // Reset after 2 seconds
            const timer = setTimeout(() => {
                setStatus('ready');
                successAnim.setValue(0);
            }, 2000);

            return () => clearTimeout(timer);
        }
    }, [status]);

    const handleCapture = async () => {
        if (status !== 'ready') return;

        setStatus('scanning');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        // Simulate face recognition (replace with actual API call)
        try {
            await new Promise((resolve) => setTimeout(resolve, 1500));

            // Mock successful recognition
            const mockStudent: Student = {
                id: `s${Math.random().toString(36).substr(2, 9)}`,
                name: ['Ali Yılmaz', 'Ayşe Demir', 'Mehmet Kaya', 'Zeynep Arslan'][
                    Math.floor(Math.random() * 4)
                ],
            };

            setLastScanned(mockStudent);
            setCheckedIn((prev) => [mockStudent, ...prev]);
            setStatus('success');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
            setStatus('error');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert('Hata', 'Yüz tanıma başarısız. Tekrar deneyin.');
            setTimeout(() => setStatus('ready'), 1500);
        }
    };

    if (!permission) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#2563eb" />
            </View>
        );
    }

    if (!permission.granted) {
        return (
            <View style={styles.permissionContainer}>
                <Text style={styles.permissionIcon}>📸</Text>
                <Text style={styles.permissionTitle}>Kamera İzni Gerekli</Text>
                <Text style={styles.permissionText}>
                    Yüz tanıma ile yoklama almak için kamera erişimi gereklidir.
                </Text>
                <TouchableOpacity
                    style={styles.permissionButton}
                    onPress={requestPermission}
                    activeOpacity={0.8}
                >
                    <Text style={styles.permissionButtonText}>İzin Ver</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Camera View */}
            <View style={styles.cameraContainer}>
                <CameraView style={styles.camera} facing={facing}>
                    {/* Overlay */}
                    <View style={styles.overlay}>
                        {/* Top info */}
                        <View style={styles.topBar}>
                            <Text style={styles.topBarText}>📋 Yoklama</Text>
                            <Text style={styles.topBarCount}>{checkedIn.length} kayıt</Text>
                        </View>

                        {/* Face guide */}
                        <Animated.View
                            style={[
                                styles.faceGuide,
                                {
                                    transform: [{ scale: pulseAnim }],
                                    borderColor:
                                        status === 'success'
                                            ? '#22c55e'
                                            : status === 'error'
                                                ? '#ef4444'
                                                : '#2563eb',
                                },
                            ]}
                        />

                        {/* Status indicator */}
                        {status === 'scanning' && (
                            <View style={styles.statusBadge}>
                                <ActivityIndicator size="small" color="#fff" />
                                <Text style={styles.statusText}>Yüz tanınıyor...</Text>
                            </View>
                        )}

                        {status === 'success' && lastScanned && (
                            <Animated.View
                                style={[
                                    styles.successBadge,
                                    {
                                        transform: [
                                            {
                                                scale: successAnim.interpolate({
                                                    inputRange: [0, 1],
                                                    outputRange: [0.5, 1],
                                                }),
                                            },
                                        ],
                                        opacity: successAnim,
                                    },
                                ]}
                            >
                                <Text style={styles.successIcon}>✅</Text>
                                <Text style={styles.successText}>{lastScanned.name}</Text>
                                <Text style={styles.successSubtext}>Giriş kaydedildi</Text>
                            </Animated.View>
                        )}
                    </View>
                </CameraView>
            </View>

            {/* Capture Button */}
            <View style={styles.controls}>
                <TouchableOpacity
                    style={[
                        styles.captureButton,
                        status === 'scanning' && styles.captureButtonDisabled,
                    ]}
                    onPress={handleCapture}
                    disabled={status !== 'ready'}
                    activeOpacity={0.8}
                >
                    <View style={styles.captureButtonInner}>
                        {status === 'scanning' ? (
                            <ActivityIndicator size="large" color="#fff" />
                        ) : (
                            <Text style={styles.captureIcon}>📸</Text>
                        )}
                    </View>
                </TouchableOpacity>
                <Text style={styles.captureHint}>
                    {status === 'ready'
                        ? 'Öğrencinin yüzünü hizalayın ve dokunun'
                        : status === 'scanning'
                            ? 'Taranıyor...'
                            : status === 'success'
                                ? 'Başarılı!'
                                : 'Tekrar deneyin'}
                </Text>
            </View>

            {/* Recent check-ins */}
            {checkedIn.length > 0 && (
                <View style={styles.recentContainer}>
                    <Text style={styles.recentTitle}>Son Girişler</Text>
                    <View style={styles.recentList}>
                        {checkedIn.slice(0, 5).map((student, index) => (
                            <View key={`${student.id}-${index}`} style={styles.recentItem}>
                                <Text style={styles.recentName}>{student.name}</Text>
                                <Text style={styles.recentTime}>
                                    {new Date().toLocaleTimeString('tr-TR', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    permissionContainer: {
        flex: 1,
        backgroundColor: '#f8fafc',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    permissionIcon: {
        fontSize: 64,
        marginBottom: 24,
    },
    permissionTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 8,
    },
    permissionText: {
        fontSize: 16,
        color: '#64748b',
        textAlign: 'center',
        marginBottom: 24,
    },
    permissionButton: {
        backgroundColor: '#2563eb',
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 12,
    },
    permissionButtonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '600',
    },
    cameraContainer: {
        flex: 1,
    },
    camera: {
        flex: 1,
    },
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    topBar: {
        position: 'absolute',
        top: 60,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
    },
    topBarText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    topBarCount: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
        backgroundColor: 'rgba(0,0,0,0.4)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 8,
    },
    faceGuide: {
        width: 250,
        height: 320,
        borderWidth: 3,
        borderRadius: 150,
        backgroundColor: 'transparent',
    },
    statusBadge: {
        position: 'absolute',
        bottom: 200,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        gap: 8,
    },
    statusText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
    },
    successBadge: {
        position: 'absolute',
        alignItems: 'center',
        backgroundColor: 'rgba(34, 197, 94, 0.9)',
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderRadius: 16,
    },
    successIcon: {
        fontSize: 40,
        marginBottom: 8,
    },
    successText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '700',
    },
    successSubtext: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        marginTop: 4,
    },
    controls: {
        position: 'absolute',
        bottom: 100,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    captureButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#fff',
        padding: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    captureButtonDisabled: {
        opacity: 0.7,
    },
    captureButtonInner: {
        flex: 1,
        borderRadius: 36,
        backgroundColor: '#2563eb',
        justifyContent: 'center',
        alignItems: 'center',
    },
    captureIcon: {
        fontSize: 32,
    },
    captureHint: {
        marginTop: 12,
        color: '#fff',
        fontSize: 14,
        textAlign: 'center',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    recentContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.8)',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 34,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    recentTitle: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 12,
    },
    recentList: {
        gap: 8,
    },
    recentItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 8,
    },
    recentName: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '500',
    },
    recentTime: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 13,
    },
});
