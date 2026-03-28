import cv2
import numpy as np
import face_recognition
from typing import List, Tuple, Optional, Dict
from scipy.spatial import distance as dist

class FaceService:
    @staticmethod
    def process_image(contents: bytes) -> Optional[np.ndarray]:
        # Use frombuffer instead of fromstring (deprecated)
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            return None
        return cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

    @staticmethod
    def get_face_encodings(rgb_img: np.ndarray) -> List[np.ndarray]:
        face_locations = face_recognition.face_locations(rgb_img)
        return face_recognition.face_encodings(rgb_img, face_locations)

    @staticmethod
    def compare_faces(probe_encoding: np.ndarray, ref_encoding: np.ndarray) -> Tuple[bool, float]:
        matches = face_recognition.compare_faces([ref_encoding], probe_encoding)
        face_distances = face_recognition.face_distance([ref_encoding], probe_encoding)
        return bool(matches[0]), float(face_distances[0])

    @staticmethod
    def calculate_ear(eye: List[Tuple[int, int]]) -> float:
        # Compute the euclidean distances between the two sets of vertical eye landmarks
        A = dist.euclidean(eye[1], eye[5])
        B = dist.euclidean(eye[2], eye[4])
        # Compute the euclidean distance between the horizontal eye landmark
        C = dist.euclidean(eye[0], eye[3])
        # EAR formula
        ear = (A + B) / (2.0 * C)
        return ear

    @staticmethod
    def verify_liveness(frames: List[np.ndarray]) -> Dict:
        """
        Analyze a sequence of frames for liveness signs (blinking, micro-movements)
        """
        if not frames:
            return {"verified": False, "score": 0, "message": "No frames provided"}

        ears = []
        landmark_history = []

        for frame in frames:
            face_landmarks_list = face_recognition.face_landmarks(frame)
            
            if not face_landmarks_list:
                continue
                
            landmarks = face_landmarks_list[0]
            
            # 1. EAR Calculation (Blink Detection)
            left_eye = landmarks.get('left_eye')
            right_eye = landmarks.get('right_eye')
            
            if left_eye and right_eye:
                left_ear = FaceService.calculate_ear(left_eye)
                right_ear = FaceService.calculate_ear(right_eye)
                ears.append((left_ear + right_ear) / 2.0)
            
            # 2. Movement Tracking (Landmark Variance)
            # We track nose bridge as a stable point for movement
            nose = landmarks.get('nose_bridge')
            if nose:
                landmark_history.append(nose[0]) # Tip of nose bridge

        if not ears:
            return {"verified": False, "score": 0, "message": "Could not detect facial features in frames"}

        # Scoring Logic
        # Variance in EAR suggests blinking or natural eye jitter
        ear_variance = np.var(ears)
        
        # Variance in nose position suggests natural head movement
        if len(landmark_history) > 1:
            coords = np.array(landmark_history)
            move_variance = np.mean(np.var(coords, axis=0))
        else:
            move_variance = 0

        # Heuristic score: if there is movement OR EAR change, it's likely alive
        liveness_score = (ear_variance * 1000) + (move_variance * 10)
        
        # A static photo will have near-zero variance
        is_verified = liveness_score > 0.01

        return {
            "verified": is_verified,
            "score": float(liveness_score),
            "frames_processed": len(ears),
            "message": "Liveness check passed" if is_verified else "Static image detected"
        }
