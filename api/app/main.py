from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from .middleware import TenantMiddleware
from .auth import get_current_user

app = FastAPI(
    title="Arkadaş Core SaaS Engine",
    description="Multi-tenant ERP API for Special Education Centers",
    version="1.0.0"
)

# 1. Register Multi-Tenant Middleware
app.add_middleware(TenantMiddleware)

# 2. CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Tenant Dependency
async def get_current_tenant(request: Request):
    return getattr(request.state, "tenant_id", "public")

@app.get("/")
async def root(tenant: str = Depends(get_current_tenant)):
    return {
        "message": "Arkadaş SaaS Engine Active",
        "current_tenant": tenant,
        "mode": "Modular"
    }

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "core-api"}

@app.get("/debug/tenant")
async def debug_tenant(tenant: str = Depends(get_current_tenant)):
    return {"resolved_tenant": tenant}

# 5. Auth Routes
@app.get("/auth/login")
async def login(request: Request):
    """Initiates OIDC login by redirecting to Nextcloud."""
    import os
    nextcloud_url = os.getenv("NEXTCLOUD_URL", "http://localhost:8088")
    client_id = "arkadas-erp"
    redirect_uri = "http://localhost:3000/auth/callback"
    
    auth_url = f"{nextcloud_url}/index.php/apps/user_oidc/authorize"
    params = {
        "response_type": "code",
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "scope": "openid profile email",
        "state": request.state.tenant_id
    }
    
    # In a real app, you'd use a redirect response here
    from fastapi.responses import RedirectResponse
    query_string = "&".join([f"{k}={v}" for k, v in params.items()])
    return RedirectResponse(f"{auth_url}?{query_string}")

@app.post("/auth/token")
async def exchange_token(payload: dict):
    """Exchanges code for Nextcloud OIDC token."""
    import os
    nextcloud_url = os.getenv("NEXTCLOUD_URL", "http://localhost:8088")
    
    # In a real app, you'd exchange this code with Nextcloud using your client_secret
    # For now, we return a mock token that the OIDCValidator can process
    # (Or proxy the request to Nextcloud)
    
    return {
        "access_token": "mock-oidc-token-validated-by-jose",
        "token_type": "Bearer",
        "expires_in": 3600
    }

# 4. User Profile (Protected by OIDC)
@app.get("/api/v1/me")
async def get_me(
    user: dict = Depends(get_current_user),
    tenant: str = Depends(get_current_tenant)
):
    """
    Returns the current user profile extracted from the Nextcloud OIDC token.
    Verifies that the user belongs to the current tenant.
    """
    return {
        "user": user,
        "tenant": tenant,
        "auth_source": "Nextcloud OIDC Bridge"
    }

@app.get("/api/v1/students")
async def get_students(
    user: dict = Depends(get_current_user),
    tenant: str = Depends(get_current_tenant)
):
    return {
        "tenant": tenant,
        "user_email": user.get("email"),
        "data": [
            {"id": 1, "name": "Test Student A"},
            {"id": 2, "name": "Test Student B"}
        ]
    }
