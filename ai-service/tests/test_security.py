import pytest
import os
from app.services.face_service import FaceRecognitionService
from app.core.config import settings

@pytest.fixture
def face_service():
    return FaceRecognitionService()

def test_tenant_isolation_filepath(face_service):
    """Verify that filepaths are correctly scoped by tenant_id"""
    user_id = "user123"
    tenant_id = "tenantA"
    
    filepath = face_service._get_user_filepath(user_id, tenant_id)
    
    # Expected path structure: .../encodings/tenantA/user123.pkl
    expected_part = os.path.join(tenant_id, f"{user_id}.pkl")
    assert expected_part in filepath
    assert filepath.startswith(settings.FACE_ENCODINGS_PATH)

def test_path_traversal_prevention(face_service):
    """Verify that path traversal attempts raise ValueError"""
    
    # Attempt 1: Traversal in user_id
    with pytest.raises(ValueError, match="Invalid user_id"):
        face_service._get_user_filepath("../evil_user", "tenant1")

    # Attempt 2: Traversal in tenant_id
    with pytest.raises(ValueError, match="Invalid user_id"): # tenant_id validates same as user_id
        face_service._get_user_filepath("user1", "../evil_tenant")

    # Attempt 3: Null byte injection (if python allows passing it)
    with pytest.raises(ValueError):
        face_service._get_user_filepath("user\0name", "tenant1")
