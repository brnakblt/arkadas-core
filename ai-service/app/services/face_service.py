"""
Face Recognition Service
Core logic for face encoding, matching, and training
Uses face_recognition library (requires Python 3.11 + dlib)
"""

import os
import re
import json
import base64
import pickle
import uuid
from io import BytesIO
from typing import List, Dict, Optional, Any
from datetime import datetime

import numpy as np
from PIL import Image

# Face recognition library
try:
    import face_recognition
    FACE_RECOGNITION_AVAILABLE = True
except ImportError:
    FACE_RECOGNITION_AVAILABLE = False
    print("⚠️ face_recognition library not available. Install with: pip install face-recognition")

from app.core.config import settings


class FaceRecognitionService:
    """
    Service for face encoding, matching, and storage
    Uses face_recognition library (based on dlib)
    """
    
    # Regex pattern for valid user IDs (alphanumeric, underscore, hyphen only)
    USER_ID_PATTERN = re.compile(r'^[a-zA-Z0-9_-]+$')
    MAX_USER_ID_LENGTH = 128
    
    def __init__(self):
        self.encodings_path = settings.FACE_ENCODINGS_PATH
        self.tolerance = settings.FACE_RECOGNITION_TOLERANCE
        self.min_confidence = settings.MIN_CONFIDENCE_SCORE
        
        # In-memory cache of encodings (loaded from disk)
        self._encodings_cache: Dict[str, List[np.ndarray]] = {}
        self._user_metadata: Dict[str, Dict[str, Any]] = {}
        
        # Create directories
        os.makedirs(self.encodings_path, exist_ok=True)
        os.makedirs(settings.TEMP_UPLOAD_PATH, exist_ok=True)
        
        # Load existing encodings on startup
        self._load_encodings()
    
    def _validate_user_id(self, user_id: str) -> str:
        """
        Validate and sanitize user_id to prevent path traversal attacks.
        Raises ValueError if user_id is invalid.
        """
        if not user_id or not isinstance(user_id, str):
            raise ValueError("user_id is required and must be a string")
        
        # Strip whitespace and get basename to prevent directory traversal
        sanitized = os.path.basename(user_id.strip())
        
        # Check length
        if len(sanitized) > self.MAX_USER_ID_LENGTH:
            raise ValueError(f"user_id exceeds maximum length of {self.MAX_USER_ID_LENGTH}")
        
        # Validate against pattern
        if not self.USER_ID_PATTERN.match(sanitized):
            raise ValueError("user_id must contain only alphanumeric characters, underscores, and hyphens")
        
        # Additional check: ensure no path separators after sanitization
        if os.path.sep in sanitized or '/' in sanitized or '\\' in sanitized:
            raise ValueError("Invalid user_id format")
        
        return sanitized
    
    def _get_user_filepath(self, user_id: str) -> str:
        """
        Safely construct filepath for user data.
        """
        sanitized_id = self._validate_user_id(user_id)
        filepath = os.path.join(self.encodings_path, f"{sanitized_id}.pkl")
        
        # Verify the path is within the expected directory
        real_encodings_path = os.path.realpath(self.encodings_path)
        real_filepath = os.path.realpath(filepath)
        
        if not real_filepath.startswith(real_encodings_path):
            raise ValueError("Invalid file path - path traversal detected")
        
        return filepath
    
    def _load_encodings(self):
        """Load all face encodings from disk into memory"""
        for filename in os.listdir(self.encodings_path):
            if filename.endswith('.pkl'):
                user_id = filename.replace('.pkl', '')
                filepath = os.path.join(self.encodings_path, filename)
                try:
                    with open(filepath, 'rb') as f:
                        data = pickle.load(f)
                        self._encodings_cache[user_id] = data.get('encodings', [])
                        self._user_metadata[user_id] = data.get('metadata', {})
                except Exception as e:
                    print(f"Error loading encodings for {user_id}: {e}")
        
        print(f"Loaded face encodings for {len(self._encodings_cache)} users")
    
    def _save_user_encodings(self, user_id: str):
        """Save user encodings to disk (user_id already validated)"""
        filepath = self._get_user_filepath(user_id)
        data = {
            'encodings': self._encodings_cache.get(user_id, []),
            'metadata': self._user_metadata.get(user_id, {}),
        }
        with open(filepath, 'wb') as f:
            pickle.dump(data, f)
    
    def _decode_image(self, image_base64: str) -> np.ndarray:
        """Decode base64 image to numpy array for face_recognition"""
        # Remove data URL prefix if present
        if ',' in image_base64:
            image_base64 = image_base64.split(',')[1]
        
        image_data = base64.b64decode(image_base64)
        image = Image.open(BytesIO(image_data))
        
        # Convert to RGB if necessary
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        return np.array(image)
    
    async def encode_face(
        self,
        image_base64: str,
        user_id: str,
    ) -> Dict[str, Any]:
        """
        Encode face from image and store for user
        """
        if not FACE_RECOGNITION_AVAILABLE:
            return {
                "success": False,
                "user_id": user_id,
                "face_count": 0,
                "message": "face_recognition library not available",
            }
        
        try:
            # Decode image
            image_array = self._decode_image(image_base64)
            
            # Find faces in image
            face_locations = face_recognition.face_locations(image_array)
            
            if not face_locations:
                return {
                    "success": False,
                    "user_id": user_id,
                    "face_count": 0,
                    "message": "No faces detected in image",
                }
            
            # Get face encodings
            face_encodings = face_recognition.face_encodings(image_array, face_locations)
            
            if not face_encodings:
                return {
                    "success": False,
                    "user_id": user_id,
                    "face_count": 0,
                    "message": "Could not encode face",
                }
            
            # Store encoding (use first face)
            encoding = face_encodings[0]
            
            if user_id not in self._encodings_cache:
                self._encodings_cache[user_id] = []
                self._user_metadata[user_id] = {
                    "created_at": datetime.now().isoformat(),
                }
            
            self._encodings_cache[user_id].append(encoding)
            self._user_metadata[user_id]["updated_at"] = datetime.now().isoformat()
            self._user_metadata[user_id]["encoding_count"] = len(self._encodings_cache[user_id])
            
            # Save to disk
            self._save_user_encodings(user_id)
            
            return {
                "success": True,
                "user_id": user_id,
                "encoding_id": str(uuid.uuid4()),
                "face_count": len(face_locations),
                "message": f"Face encoded. Total: {len(self._encodings_cache[user_id])}",
            }
            
        except Exception as e:
            return {
                "success": False,
                "user_id": user_id,
                "face_count": 0,
                "message": f"Error encoding face: {str(e)}",
            }
    
    async def match_face(
        self,
        image_base64: str,
    ) -> Dict[str, Any]:
        """
        Match face against all stored encodings
        """
        if not FACE_RECOGNITION_AVAILABLE:
            return {
                "success": False,
                "matches": [],
                "best_match": None,
                "message": "face_recognition library not available",
            }
        
        try:
            # Decode image
            image_array = self._decode_image(image_base64)
            
            # Find faces
            face_locations = face_recognition.face_locations(image_array)
            
            if not face_locations:
                return {
                    "success": False,
                    "matches": [],
                    "best_match": None,
                    "message": "No faces detected in image",
                }
            
            # Get encoding for first face
            face_encodings = face_recognition.face_encodings(image_array, face_locations)
            
            if not face_encodings:
                return {
                    "success": False,
                    "matches": [],
                    "best_match": None,
                    "message": "Could not encode face for matching",
                }
            
            unknown_encoding = face_encodings[0]
            
            # Compare against all stored encodings
            matches = []
            
            for user_id, stored_encodings in self._encodings_cache.items():
                if not stored_encodings:
                    continue
                
                # Calculate distances to all encodings for this user
                distances = face_recognition.face_distance(stored_encodings, unknown_encoding)
                
                # Get best (minimum) distance
                min_distance = min(distances)
                
                # Convert distance to confidence (0-1, higher is better)
                confidence = 1 - min_distance
                
                if confidence >= self.min_confidence:
                    matches.append({
                        "user_id": user_id,
                        "confidence": round(float(confidence), 4),
                        "display_name": self._user_metadata.get(user_id, {}).get("display_name"),
                    })
            
            # Sort by confidence (highest first)
            matches.sort(key=lambda x: x["confidence"], reverse=True)
            best_match = matches[0] if matches else None
            
            return {
                "success": True,
                "matches": matches,
                "best_match": best_match,
                "message": f"Found {len(matches)} matches",
            }
            
        except Exception as e:
            return {
                "success": False,
                "matches": [],
                "best_match": None,
                "message": f"Error: {str(e)}",
            }
    
    async def train_user(
        self,
        user_id: str,
        images_base64: List[str],
    ) -> Dict[str, Any]:
        """Train with multiple images for a user"""
        processed = 0
        
        for image_base64 in images_base64:
            result = await self.encode_face(image_base64, user_id)
            if result["success"]:
                processed += 1
        
        return {
            "success": processed > 0,
            "user_id": user_id,
            "images_processed": processed,
            "message": f"Processed {processed}/{len(images_base64)} images",
        }
    
    async def delete_user_encodings(self, user_id: str) -> bool:
        """Delete all encodings for a user (with path traversal protection)"""
        # Validate user_id first
        sanitized_id = self._validate_user_id(user_id)
        
        self._encodings_cache.pop(sanitized_id, None)
        self._user_metadata.pop(sanitized_id, None)
        
        filepath = self._get_user_filepath(sanitized_id)
        if os.path.exists(filepath):
            os.remove(filepath)
        
        return True
    
    async def list_enrolled_users(self) -> List[Dict[str, Any]]:
        """List all users with face encodings"""
        return [
            {
                "user_id": user_id,
                "embedding_count": len(self._encodings_cache.get(user_id, [])),
                **metadata,
            }
            for user_id, metadata in self._user_metadata.items()
        ]
