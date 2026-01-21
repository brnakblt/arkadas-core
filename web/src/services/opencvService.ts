
const OPENCV_API_URL = process.env.NEXT_PUBLIC_OPENCV_API_URL || 'http://localhost:8000';

export interface VerifyResult {
    status: string;
    faces_detected: number;
    verified: boolean;
    distance?: number;
    message: string;
}

export const opencvService = {
    async verifyFace(probeImage: Blob, referenceImageUrl?: string): Promise<VerifyResult> {
        try {
            const formData = new FormData();
            formData.append('image', probeImage, 'probe.jpg');

            if (referenceImageUrl) {
                // Fetch the reference image and convert to blob
                // Note: This relies on the reference URL being accessible (CORS)
                // In production, might be better to handle this server-side
                try {
                    const refResponse = await fetch(referenceImageUrl);
                    const refBlob = await refResponse.blob();
                    formData.append('reference_image', refBlob, 'reference.jpg');
                } catch (e) {
                    console.warn("Failed to fetch reference image for comparison", e);
                }
            }

            const response = await fetch(`${OPENCV_API_URL}/verify`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`OpenCV Service Error: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error("Verification failed:", error);
            throw error;
        }
    }
};
