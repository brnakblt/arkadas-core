from fastapi.testclient import TestClient

def test_health_check(client: TestClient):
    """Verify health check endpoint returns 200 OK"""
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy", "service": "ai-face-recognition"}
