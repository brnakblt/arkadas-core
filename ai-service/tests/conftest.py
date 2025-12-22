import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock
import sys

# Mock dlib and face_recognition BEFORE importing app components
module_mock = MagicMock()
sys.modules["dlib"] = module_mock
sys.modules["face_recognition"] = module_mock

# Mock PIL to avoid real image processing
pil_mock = MagicMock()
sys.modules["PIL"] = pil_mock
# Setup Image.open to return a mock that behaves like an image
image_mock = MagicMock()
image_mock.convert.return_value = image_mock
# Make sure np.array(image_mock) works (it usually does with mocks, but let's be safe)
pil_mock.Image.open.return_value = image_mock

# Mock specific functions used in face_service
module_mock.load_image_file.return_value = "mock_image_data"
module_mock.face_encodings.return_value = [[0.1, 0.2, 0.3]]  # Mock encoding
module_mock.compare_faces.return_value = [True]  # Mock match result
module_mock.face_distance.return_value = [0.1]  # Mock distances
module_mock.face_locations.return_value = [(0, 0, 100, 100)]  # Mock face location

from app.main import app
from app.core.auth import verify_api_key

async def mock_verify_api_key():
    return "test-api-key"

app.dependency_overrides[verify_api_key] = mock_verify_api_key

@pytest.fixture
def client():
    """FastAPI Test Client"""
    return TestClient(app)

@pytest.fixture
def mock_face_recognition():
    """Return the mock object for verification in tests"""
    return module_mock
