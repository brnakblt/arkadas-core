"""
PostgreSQL Database Connection for AI Service
Uses SQLAlchemy with asyncpg for async operations
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from sqlalchemy.pool import QueuePool

from app.core.config import settings


class Base(DeclarativeBase):
    """Base class for SQLAlchemy models"""
    pass


# Create engine
engine = None
SessionLocal = None


def get_engine():
    """Get or create database engine"""
    global engine
    if engine is None:
        if not settings.DATABASE_URL:
            raise ValueError("DATABASE_URL not configured")
        
        engine = create_engine(
            settings.DATABASE_URL,
            poolclass=QueuePool,
            pool_size=5,
            max_overflow=10,
            pool_timeout=30,
            pool_pre_ping=True,
        )
    return engine


def get_session():
    """Get database session"""
    global SessionLocal
    if SessionLocal is None:
        SessionLocal = sessionmaker(
            autocommit=False,
            autoflush=False,
            bind=get_engine(),
        )
    return SessionLocal()


def init_db():
    """Initialize database tables"""
    Base.metadata.create_all(bind=get_engine())
