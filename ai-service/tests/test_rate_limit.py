
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.auth import verify_api_key

client = TestClient(app)

def test_rate_limiting_encode():
    # Override dependency to bypass actual auth logic
    app.dependency_overrides[verify_api_key] = lambda: "test_key"
    
    payload = {
        "image_base64": "invalid_base64_string",
        "user_id": "test_user",
        "tenant_id": "test_tenant"
    }

    # The limit is 10/minute.
    # We make 10 requests. They might fail with 400 (invalid image) or 500, 
    # but SHOULD NOT fail with 429.
    for i in range(10):
        response = client.post("/api/encode", json=payload)
        assert response.status_code != 429, f"Request {i+1} was rate limited unexpectedly"

    # The 11th request should be rate limited
    response = client.post("/api/encode", json=payload)
    assert response.status_code == 429, "Request 11 should have been rate limited"
    
    # Cleanup
    app.dependency_overrides = {}
