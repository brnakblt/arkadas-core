import httpx
import logging
from jose import jwt, JWTError
from fastapi import HTTPException, Security, Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from typing import Optional, List, Dict
import time

logger = logging.getLogger(__name__)

class OIDCValidator:
    """
    Handles JWT validation for Nextcloud OIDC tokens.
    Fetches public keys (JWKS) dynamically from the provider.
    """
    
    def __init__(self, nextcloud_url: str):
        self.nextcloud_url = nextcloud_url.rstrip("/")
        self.jwks_url = f"{self.nextcloud_url}/index.php/apps/user_oidc/jwks"
        self.issuer = f"{self.nextcloud_url}/index.php/apps/user_oidc/"
        self._jwks: Optional[Dict] = None
        self._last_fetch = 0
        self._cache_ttl = 3600  # Cache keys for 1 hour

    async def _get_jwks(self) -> Dict:
        """Fetch and cache JWKS from Nextcloud."""
        now = time.time()
        if not self._jwks or (now - self._last_fetch) > self._cache_ttl:
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.get(self.jwks_url)
                    response.raise_for_status()
                    self._jwks = response.json()
                    self._last_fetch = now
                    logger.info("Successfully fetched fresh JWKS from Nextcloud")
            except Exception as e:
                logger.error(f"Failed to fetch JWKS: {e}")
                if not self._jwks:
                    raise HTTPException(status_code=503, detail="Identity provider unavailable")
        return self._jwks

    async def validate_token(self, token: str) -> Dict:
        """
        Validate token signature, expiration, and issuer.
        """
        jwks = await self._get_jwks()
        
        try:
            # Unverified header to find the Key ID (kid)
            header = jwt.get_unverified_header(token)
            kid = header.get("kid")
            
            # Find the matching key in JWKS
            rsa_key = {}
            for key in jwks.get("keys", []):
                if key["kid"] == kid:
                    rsa_key = {
                        "kty": key["kty"],
                        "kid": key["kid"],
                        "use": key["use"],
                        "n": key["n"],
                        "e": key["e"]
                    }
                    break
            
            if not rsa_key:
                raise HTTPException(status_code=401, detail="Invalid token header (kid not found)")

            # Verify token
            payload = jwt.decode(
                token,
                rsa_key,
                algorithms=["RS256"],
                audience="arkadas-erp", # This should match your OIDC client ID in Nextcloud
                issuer=self.issuer
            )
            return payload

        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token has expired")
        except jwt.JWTClaimsError:
            raise HTTPException(status_code=401, detail="Invalid claims (check issuer/audience)")
        except Exception as e:
            logger.error(f"JWT Validation Error: {e}")
            raise HTTPException(status_code=401, detail="Could not validate credentials")

# ------------------------------------------------------------
# FastAPI Dependencies
# ------------------------------------------------------------

auth_scheme = HTTPBearer()

async def get_current_user(
    token: HTTPAuthorizationCredentials = Security(auth_scheme),
    # nextcloud_url would normally come from app config/env
):
    """
    FastAPI dependency to extract and validate the user from the Bearer token.
    """
    import os
    nextcloud_url = os.getenv("NEXTCLOUD_URL", "http://localhost:8088")
    validator = OIDCValidator(nextcloud_url)
    
    payload = await validator.validate_token(token.credentials)
    
    return {
        "uid": payload.get("sub"),
        "email": payload.get("email"),
        "name": payload.get("name"),
        "groups": payload.get("groups", []),
        "tenant_id": payload.get("tenant_id") # Custom claim if configured in Nextcloud
    }
