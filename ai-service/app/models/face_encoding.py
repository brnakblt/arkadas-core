"""
Face Encoding Model
SQLAlchemy model for storing face encodings in PostgreSQL
"""

from sqlalchemy import Column, String, DateTime, LargeBinary, Float, Integer
from datetime import datetime
import uuid

from app.core.database import Base


class FaceEncoding(Base):
    """Face encoding stored in PostgreSQL"""
    
    __tablename__ = "face_encodings"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(128), nullable=False, index=True)
    tenant_id = Column(String(128), nullable=False, index=True)
    encoding = Column(LargeBinary, nullable=False)  # numpy array serialized as bytes
    confidence = Column(Float, default=0.0)
    encoding_index = Column(Integer, default=0)  # For multiple encodings per user
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<FaceEncoding(user_id={self.user_id}, tenant_id={self.tenant_id})>"
