/**
 * Camera Hook for React Native with Expo
 * Handles camera permissions, photo capture, and face detection prep
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

interface PhotoResult {
    uri: string;
    base64?: string;
    width: number;
    height: number;
}

interface UseCameraOptions {
    initialFacing?: CameraType;
    enableBase64?: boolean;
    quality?: number;
    onPhotoTaken?: (photo: PhotoResult) => void;
    onError?: (error: string) => void;
}

interface UseCameraReturn {
    cameraRef: React.RefObject<CameraView>;
    facing: CameraType;
    permission: boolean | null;
    isReady: boolean;
    requestPermission: () => Promise<boolean>;
    toggleFacing: () => void;
    takePhoto: () => Promise<PhotoResult | null>;
    pickImage: () => Promise<PhotoResult | null>;
}

export function useCamera(options: UseCameraOptions = {}): UseCameraReturn {
    const {
        initialFacing = 'front',
        enableBase64 = true,
        quality = 0.8,
        onPhotoTaken,
        onError,
    } = options;

    const [facing, setFacing] = useState<CameraType>(initialFacing);
    const [isReady, setIsReady] = useState(false);
    const [permission, requestCameraPermission] = useCameraPermissions();

    const cameraRef = useRef<CameraView>(null);

    const requestPermission = useCallback(async (): Promise<boolean> => {
        try {
            const result = await requestCameraPermission();

            if (!result.granted) {
                const message = 'Kamera izni verilmedi';
                onError?.(message);
                return false;
            }

            // Also request media library permission for saving photos
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

            return result.granted;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Kamera izni alınamadı';
            onError?.(message);
            return false;
        }
    }, [requestCameraPermission, onError]);

    const toggleFacing = useCallback(() => {
        setFacing(current => (current === 'back' ? 'front' : 'back'));
    }, []);

    const takePhoto = useCallback(async (): Promise<PhotoResult | null> => {
        if (!cameraRef.current) {
            onError?.('Kamera hazır değil');
            return null;
        }

        try {
            const photo = await cameraRef.current.takePictureAsync({
                quality,
                base64: enableBase64,
                exif: false,
            });

            if (!photo) {
                throw new Error('Fotoğraf çekilemedi');
            }

            const result: PhotoResult = {
                uri: photo.uri,
                base64: photo.base64,
                width: photo.width,
                height: photo.height,
            };

            onPhotoTaken?.(result);
            return result;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Fotoğraf çekme hatası';
            onError?.(message);
            return null;
        }
    }, [quality, enableBase64, onPhotoTaken, onError]);

    const pickImage = useCallback(async (): Promise<PhotoResult | null> => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality,
                base64: enableBase64,
            });

            if (result.canceled || !result.assets[0]) {
                return null;
            }

            const asset = result.assets[0];
            const photoResult: PhotoResult = {
                uri: asset.uri,
                base64: asset.base64 || undefined,
                width: asset.width,
                height: asset.height,
            };

            onPhotoTaken?.(photoResult);
            return photoResult;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Görsel seçme hatası';
            onError?.(message);
            return null;
        }
    }, [quality, enableBase64, onPhotoTaken, onError]);

    return {
        cameraRef,
        facing,
        permission: permission?.granted ?? null,
        isReady,
        requestPermission,
        toggleFacing,
        takePhoto,
        pickImage,
    };
}

/**
 * Convert image URI to base64 for API submission
 */
export async function imageToBase64(uri: string): Promise<string> {
    const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
    });
    return base64;
}

export default useCamera;
