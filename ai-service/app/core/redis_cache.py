"""
Redis Cache for Face Encodings (Multi-Tenant)
Provides fast in-memory cache with TTL for face encoding data

SECURITY:
- Uses SCAN instead of KEYS to prevent blocking Redis
- All keys are tenant-scoped: tenant:{tenant_id}:face:encoding:{user_id}
- Sanitizes tenant_id and user_id to prevent injection
"""

import json
import re
import numpy as np
from typing import Optional, Dict, List, Any, Iterator
import redis

from app.core.config import settings


class RedisCache:
    """Redis-backed cache for face encodings with multi-tenant support"""
    
    # Key format: tenant:{tenant_id}:{type}:{key}
    ENCODING_PREFIX = "tenant"
    METADATA_PREFIX = "tenant"
    DEFAULT_TTL = 300  # 5 minutes
    
    # SECURITY: Pattern for valid tenant/user IDs
    SAFE_ID_PATTERN = re.compile(r'^[a-zA-Z0-9_-]+$')
    
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
    
    def _sanitize_id(self, id_value: str) -> str:
        """
        SECURITY: Sanitize ID to prevent Redis pattern injection
        """
        if not id_value:
            raise ValueError("ID cannot be empty")
        
        sanitized = id_value.strip()
        sanitized = sanitized.replace('*', '').replace('?', '').replace('[', '').replace(']', '')
        
        if not self.SAFE_ID_PATTERN.match(sanitized):
            raise ValueError(f"Invalid ID format: {id_value[:50]}")
        
        return sanitized
    
    def _encoding_key(self, user_id: str, tenant_id: str) -> str:
        """Generate tenant-scoped encoding key"""
        safe_tenant = self._sanitize_id(tenant_id)
        safe_user = self._sanitize_id(user_id)
        return f"tenant:{safe_tenant}:face:encoding:{safe_user}"
    
    def _metadata_key(self, user_id: str, tenant_id: str) -> str:
        """Generate tenant-scoped metadata key"""
        safe_tenant = self._sanitize_id(tenant_id)
        safe_user = self._sanitize_id(user_id)
        return f"tenant:{safe_tenant}:face:meta:{safe_user}"
    
    def get_encoding(self, user_id: str, tenant_id: str) -> Optional[List[np.ndarray]]:
        """Get encodings from cache for a specific tenant"""
        key = self._encoding_key(user_id, tenant_id)
        data = self.client.get(key)
        
        if data is None:
            return None
        
        encoded_list = json.loads(data)
        return [np.array(e) for e in encoded_list]
    
    def set_encoding(
        self,
        user_id: str,
        tenant_id: str,
        encodings: List[np.ndarray],
        ttl: int = DEFAULT_TTL
    ) -> None:
        """Store encodings in cache with tenant scope"""
        key = self._encoding_key(user_id, tenant_id)
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
        """Invalidate cache for a user in a specific tenant"""
        self.client.delete(
            self._encoding_key(user_id, tenant_id),
            self._metadata_key(user_id, tenant_id)
        )
    
    def _scan_keys(self, pattern: str) -> Iterator[bytes]:
        """
        SECURITY: Use SCAN instead of KEYS to prevent blocking Redis
        """
        cursor = 0
        while True:
            cursor, keys = self.client.scan(cursor=cursor, match=pattern, count=100)
            for key in keys:
                yield key
            if cursor == 0:
                break
    
    def invalidate_tenant(self, tenant_id: str) -> None:
        """
        Invalidate all cache entries for a tenant
        SECURITY: Uses SCAN with tenant-scoped pattern
        """
        safe_tenant = self._sanitize_id(tenant_id)
        
        # All tenant keys use tenant:{id}:* pattern
        pattern = f"tenant:{safe_tenant}:*"
        keys_to_delete = list(self._scan_keys(pattern))
        if keys_to_delete:
            self.client.delete(*keys_to_delete)
    
    def get_all_for_tenant(self, tenant_id: str) -> Dict[str, List[np.ndarray]]:
        """
        Get all encodings for a tenant (for face matching)
        SECURITY: Only scans within tenant scope
        """
        safe_tenant = self._sanitize_id(tenant_id)
        pattern = f"tenant:{safe_tenant}:face:encoding:*"
        
        result = {}
        for key in self._scan_keys(pattern):
            key_str = key.decode() if isinstance(key, bytes) else key
            # Extract user_id: tenant:{tenant}:face:encoding:{user_id}
            parts = key_str.split(':')
            if len(parts) >= 5:
                user_id = parts[4]
                data = self.client.get(key)
                if data:
                    encoded_list = json.loads(data)
                    result[user_id] = [np.array(e) for e in encoded_list]
        
        return result


# Singleton instance
cache = RedisCache()
