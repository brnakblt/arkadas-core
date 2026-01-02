"""
Redis Cache for Face Encodings
Provides fast in-memory cache with TTL for face encoding data
"""

import json
import numpy as np
from typing import Optional, Dict, List, Any
import redis

from app.core.config import settings


class RedisCache:
    """Redis-backed cache for face encodings"""
    
    ENCODING_PREFIX = "face:encoding:"
    METADATA_PREFIX = "face:meta:"
    DEFAULT_TTL = 300  # 5 minutes
    
    def __init__(self):
        self._client: Optional[redis.Redis] = None
    
    @property
    def client(self) -> redis.Redis:
        """Lazy connection to Redis"""
        if self._client is None:
            self._client = redis.Redis.from_url(
                settings.REDIS_URL,
                password=settings.REDIS_PASSWORD,
                decode_responses=False,
            )
        return self._client
    
    def _encoding_key(self, user_id: str, tenant_id: str) -> str:
        return f"{self.ENCODING_PREFIX}{tenant_id}:{user_id}"
    
    def _metadata_key(self, user_id: str, tenant_id: str) -> str:
        return f"{self.METADATA_PREFIX}{tenant_id}:{user_id}"
    
    def get_encoding(self, user_id: str, tenant_id: str) -> Optional[List[np.ndarray]]:
        """Get encodings from cache"""
        key = self._encoding_key(user_id, tenant_id)
        data = self.client.get(key)
        
        if data is None:
            return None
        
        # Deserialize numpy arrays from bytes
        encoded_list = json.loads(data)
        return [np.array(e) for e in encoded_list]
    
    def set_encoding(
        self,
        user_id: str,
        tenant_id: str,
        encodings: List[np.ndarray],
        ttl: int = DEFAULT_TTL
    ) -> None:
        """Store encodings in cache"""
        key = self._encoding_key(user_id, tenant_id)
        
        # Serialize numpy arrays to lists for JSON
        encoded_list = [e.tolist() for e in encodings]
        
        self.client.setex(key, ttl, json.dumps(encoded_list))
    
    def get_metadata(self, user_id: str, tenant_id: str) -> Optional[Dict[str, Any]]:
        """Get user metadata from cache"""
        key = self._metadata_key(user_id, tenant_id)
        data = self.client.get(key)
        
        if data is None:
            return None
        
        return json.loads(data)
    
    def set_metadata(
        self,
        user_id: str,
        tenant_id: str,
        metadata: Dict[str, Any],
        ttl: int = DEFAULT_TTL
    ) -> None:
        """Store metadata in cache"""
        key = self._metadata_key(user_id, tenant_id)
        self.client.setex(key, ttl, json.dumps(metadata))
    
    def invalidate(self, user_id: str, tenant_id: str) -> None:
        """Invalidate cache for a user"""
        self.client.delete(
            self._encoding_key(user_id, tenant_id),
            self._metadata_key(user_id, tenant_id)
        )
    
    def invalidate_tenant(self, tenant_id: str) -> None:
        """Invalidate all cache entries for a tenant"""
        pattern = f"{self.ENCODING_PREFIX}{tenant_id}:*"
        keys = self.client.keys(pattern)
        if keys:
            self.client.delete(*keys)
        
        pattern = f"{self.METADATA_PREFIX}{tenant_id}:*"
        keys = self.client.keys(pattern)
        if keys:
            self.client.delete(*keys)
    
    def get_all_for_tenant(self, tenant_id: str) -> Dict[str, List[np.ndarray]]:
        """Get all encodings for a tenant (for matching)"""
        pattern = f"{self.ENCODING_PREFIX}{tenant_id}:*"
        keys = self.client.keys(pattern)
        
        result = {}
        for key in keys:
            # Extract user_id from key
            key_str = key.decode() if isinstance(key, bytes) else key
            user_id = key_str.split(':')[-1]
            
            data = self.client.get(key)
            if data:
                encoded_list = json.loads(data)
                result[user_id] = [np.array(e) for e in encoded_list]
        
        return result


# Singleton instance
cache = RedisCache()
