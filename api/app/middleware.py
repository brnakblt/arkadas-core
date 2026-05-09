import re
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi.responses import JSONResponse
from typing import List

class TenantMiddleware(BaseHTTPMiddleware):
    """
    Middleware to resolve and validate the Tenant ID.
    Enforces 'Fail-Closed' security for protected routes.
    """
    
    def __init__(self, app):
        super().__init__(app)
        # Regex patterns for subdomain parsing
        self.local_pattern = re.compile(r"^([a-z0-9-]+)\.localhost", re.IGNORECASE)
        self.prod_pattern = re.compile(r"^([a-z0-9-]+)\.arkadas\.com\.tr", re.IGNORECASE)
        
        # Hardcoded for now, will move to DB/Cache lookup in Phase 3
        self.ALLOWED_TENANTS = ["arkadas", "demo", "test-center", "school-a"]
        
        # Routes that require a valid tenant (cannot be 'public')
        self.PROTECTED_PREFIXES = ["/api", "/admin", "/students", "/dashboard"]

    async def dispatch(self, request: Request, call_next):
        # 1. Resolve Tenant ID
        tenant_id = request.headers.get("X-Tenant-ID")

        if not tenant_id:
            host = request.headers.get("host", "")
            local_match = self.local_pattern.match(host)
            if local_match:
                tenant_id = local_match.group(1)
            else:
                prod_match = self.prod_pattern.match(host)
                if prod_match:
                    tenant_id = prod_match.group(1)

        # 2. Assign 'public' if still unresolved
        if not tenant_id:
            tenant_id = "public"

        # 3. Security Enforcement (Fail-Closed)
        path = request.url.path
        is_protected = any(path.startswith(prefix) for prefix in self.PROTECTED_PREFIXES)

        if is_protected:
            if tenant_id == "public" or tenant_id not in self.ALLOWED_TENANTS:
                return JSONResponse(
                    status_code=403,
                    content={
                        "success": False,
                        "error": "Access Denied",
                        "message": f"Route '{path}' requires a valid tenant. '{tenant_id}' is not authorized."
                    }
                )

        # 4. Attach to Request State
        request.state.tenant_id = tenant_id

        # 5. Execute Request
        response = await call_next(request)

        # 6. Response Header
        response.headers["X-Resolved-Tenant"] = tenant_id
        
        return response
