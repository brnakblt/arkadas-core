import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Vibration, Platform } from 'react-native';

// ============================================================
// Types
// ============================================================

interface QRData {
    studentId: string;
    action: 'check-in' | 'check-out';
    timestamp: string;
}

interface QRAttendanceProps {
    onScan: (data: QRData) => Promise<void>;
    onClose: () => void;
}

// ============================================================
// QR Attendance Screen
// ============================================================

export function QRAttendanceScreen({ onScan, onClose }: QRAttendanceProps) {
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [lastResult, setLastResult] = useState<{ success: boolean; message: string } | null>(null);

    // Handle QR code scan
    const handleBarCodeScanned = useCallback(async ({ data }: { data: string }) => {
        if (scanned || processing) return;

        setScanned(true);
        setProcessing(true);

        // Vibrate on scan
        if (Platform.OS !== 'web') {
            Vibration.vibrate(100);
        }

        try {
            // Parse QR data
            const qrData = parseQRCode(data);

            if (!qrData) {
                setLastResult({ success: false, message: 'Geçersiz QR kod' });
                return;
            }

            // Process attendance
            await onScan(qrData);
            setLastResult({ success: true, message: 'Yoklama kaydedildi ✓' });

        } catch (error) {
            setLastResult({
                success: false,
                message: error instanceof Error ? error.message : 'Hata oluştu'
            });
        } finally {
            setProcessing(false);

            // Reset after delay
            setTimeout(() => {
                setScanned(false);
                setLastResult(null);
            }, 2000);
        }
    }, [scanned, processing, onScan]);

    // Permission not determined
    if (!permission) {
        return <View style={styles.container} />;
    }

    // Permission denied
    if (!permission.granted) {
        return (
            <View style={styles.container}>
                <View style={styles.permissionBox}>
                    <Text style={styles.permissionTitle}>📷 Kamera İzni Gerekli</Text>
                    <Text style={styles.permissionText}>
                        QR kod okumak için kamera erişimine izin verin
                    </Text>
                    <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
                        <Text style={styles.permissionButtonText}>İzin Ver</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <CameraView
                style={styles.camera}
                barcodeScannerSettings={{
                    barcodeTypes: ['qr'],
                }}
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Text style={styles.closeButtonText}>✕</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>QR Yoklama</Text>
                    <View style={styles.placeholder} />
                </View>

                {/* Scan Frame */}
                <View style={styles.scanArea}>
                    <View style={styles.scanFrame}>
                        <View style={[styles.corner, styles.topLeft]} />
                        <View style={[styles.corner, styles.topRight]} />
                        <View style={[styles.corner, styles.bottomLeft]} />
                        <View style={[styles.corner, styles.bottomRight]} />
                    </View>
                    <Text style={styles.scanText}>
                        QR kodu çerçeveye hizalayın
                    </Text>
                </View>

                {/* Result Overlay */}
                {lastResult && (
                    <View style={[
                        styles.resultOverlay,
                        lastResult.success ? styles.resultSuccess : styles.resultError
                    ]}>
                        <Text style={styles.resultText}>{lastResult.message}</Text>
                    </View>
                )}

                {/* Processing indicator */}
                {processing && (
                    <View style={styles.processingOverlay}>
                        <Text style={styles.processingText}>İşleniyor...</Text>
                    </View>
                )}
            </CameraView>
        </View>
    );
}

// ============================================================
// QR Code Parser
// ============================================================

// SECURITY FIX #12: Validate studentId format
const STUDENT_ID_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/;
const VALID_ACTIONS = ['check-in', 'check-out'] as const;

function validateStudentId(id: unknown): string | null {
    if (typeof id !== 'string') return null;
    if (!STUDENT_ID_PATTERN.test(id)) return null;
    return id;
}

function validateAction(action: unknown): 'check-in' | 'check-out' | null {
    if (typeof action !== 'string') return null;
    if (!VALID_ACTIONS.includes(action as 'check-in' | 'check-out')) return null;
    return action as 'check-in' | 'check-out';
}

function parseQRCode(data: string): QRData | null {
    try {
        // Try JSON format first
        const parsed = JSON.parse(data);
        const studentId = validateStudentId(parsed.studentId);
        const action = validateAction(parsed.action);

        if (studentId && action) {
            return {
                studentId,
                action,
                timestamp: parsed.timestamp || new Date().toISOString(),
            };
        }
        return null;
    } catch {
        // Try URL format: arkadas://attendance?id=123&action=check-in
        try {
            const url = new URL(data);
            const studentId = validateStudentId(url.searchParams.get('id'));
            const action = validateAction(url.searchParams.get('action'));

            if (studentId && action) {
                return {
                    studentId,
                    action,
                    timestamp: new Date().toISOString(),
                };
            }
        } catch {
            // Try simple format: STUDENT_123_CHECKIN
            const match = data.match(/^STUDENT_([a-zA-Z0-9_-]{1,64})_(CHECKIN|CHECKOUT)$/);
            if (match) {
                return {
                    studentId: match[1],
                    action: match[2] === 'CHECKIN' ? 'check-in' : 'check-out',
                    timestamp: new Date().toISOString(),
                };
            }
        }
        return null;
    }
}

// ============================================================
// QR Code Generator (for printing)
// ============================================================

export function generateQRData(studentId: string, action: 'check-in' | 'check-out'): string {
    return JSON.stringify({
        studentId,
        action,
        timestamp: new Date().toISOString(),
    });
}

// ============================================================
// Styles
// ============================================================

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    camera: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 60,
        paddingHorizontal: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeButtonText: {
        fontSize: 20,
        color: '#fff',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
    },
    placeholder: {
        width: 40,
    },
    scanArea: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scanFrame: {
        width: 250,
        height: 250,
        position: 'relative',
    },
    corner: {
        position: 'absolute',
        width: 30,
        height: 30,
        borderColor: '#00ff88',
        borderWidth: 4,
    },
    topLeft: {
        top: 0,
        left: 0,
        borderRightWidth: 0,
        borderBottomWidth: 0,
    },
    topRight: {
        top: 0,
        right: 0,
        borderLeftWidth: 0,
        borderBottomWidth: 0,
    },
    bottomLeft: {
        bottom: 0,
        left: 0,
        borderRightWidth: 0,
        borderTopWidth: 0,
    },
    bottomRight: {
        bottom: 0,
        right: 0,
        borderLeftWidth: 0,
        borderTopWidth: 0,
    },
    scanText: {
        marginTop: 30,
        fontSize: 16,
        color: '#fff',
        textAlign: 'center',
    },
    resultOverlay: {
        position: 'absolute',
        bottom: 100,
        left: 20,
        right: 20,
        padding: 20,
        borderRadius: 12,
        alignItems: 'center',
    },
    resultSuccess: {
        backgroundColor: 'rgba(0, 200, 100, 0.9)',
    },
    resultError: {
        backgroundColor: 'rgba(220, 50, 50, 0.9)',
    },
    resultText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
    },
    processingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    processingText: {
        fontSize: 18,
        color: '#fff',
    },
    permissionBox: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    permissionTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 16,
    },
    permissionText: {
        fontSize: 16,
        color: '#aaa',
        textAlign: 'center',
        marginBottom: 24,
    },
    permissionButton: {
        backgroundColor: '#4f46e5',
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 12,
    },
    permissionButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
});
