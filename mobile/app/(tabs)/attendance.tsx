/**
 * Attendance Screen - Camera for face recognition
 */

import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import { checkInWithFace } from '../../src/api';

export default function AttendanceScreen() {
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [cameraReady, setCameraReady] = useState(false);
    const [processing, setProcessing] = useState(false);

    const requestPermission = async () => {
        const { status } = await Camera.requestCameraPermissionsAsync();
        setHasPermission(status === 'granted');
    };

    const takePicture = async () => {
        // Placeholder - actual implementation needs CameraView ref
        Alert.alert(
            'Yoklama',
            'Yüz tanıma ile yoklama özelliği yakında aktif olacak.',
            [{ text: 'Tamam' }]
        );
    };

    if (hasPermission === null) {
        return (
            <View style={styles.container}>
                <Text style={styles.message}>Kamera izni gerekli</Text>
                <TouchableOpacity style={styles.button} onPress={requestPermission}>
                    <Text style={styles.buttonText}>İzin Ver</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (hasPermission === false) {
        return (
            <View style={styles.container}>
                <Text style={styles.message}>Kamera erişimi reddedildi</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.cameraContainer}>
                <CameraView
                    style={styles.camera}
                    facing="front"
                    onCameraReady={() => setCameraReady(true)}
                />
                <View style={styles.overlay}>
                    <View style={styles.faceGuide} />
                </View>
            </View>

            <View style={styles.controls}>
                <Text style={styles.instruction}>
                    Yüzünüzü çerçeveye hizalayın
                </Text>
                <TouchableOpacity
                    style={[styles.captureButton, !cameraReady && styles.disabled]}
                    onPress={takePicture}
                    disabled={!cameraReady || processing}
                >
                    <Text style={styles.captureText}>
                        {processing ? 'İşleniyor...' : 'Yoklama Al'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    message: {
        color: '#fff',
        fontSize: 16,
        marginBottom: 20,
    },
    button: {
        backgroundColor: '#2563eb',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
    },
    cameraContainer: {
        flex: 1,
        width: '100%',
    },
    camera: {
        flex: 1,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    faceGuide: {
        width: 250,
        height: 300,
        borderWidth: 2,
        borderColor: '#2563eb',
        borderRadius: 150,
        backgroundColor: 'transparent',
    },
    controls: {
        padding: 20,
        backgroundColor: '#111',
        width: '100%',
        alignItems: 'center',
    },
    instruction: {
        color: '#fff',
        marginBottom: 16,
    },
    captureButton: {
        backgroundColor: '#2563eb',
        paddingHorizontal: 40,
        paddingVertical: 16,
        borderRadius: 30,
    },
    disabled: {
        opacity: 0.5,
    },
    captureText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
});
