import sys
import os
from pathlib import Path
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

# Add project root and backend to sys.path
current_file = Path(__file__).resolve()
project_root = current_file.parent.parent
sys.path.insert(0, str(project_root))
sys.path.insert(0, str(current_file.parent))

# Import app
try:
    from backend.main import app
except ImportError:
    from main import app

client = TestClient(app)

def test_crash_fix():
    print("Testing error handling in /analyze...")
    
    # Mock error response from run_analysis
    mock_error_response = {
        "error": True,
        "error_type": "connection",
        "error_message": "Ollama is not running",
        "retry_attempted": True
    }

    # Patch run_analysis in backend.main
    with patch("backend.main.run_analysis", return_value=mock_error_response):
        # We need to send files to trigger the endpoint
        files = {
            "old_file": ("old.txt", b"old content", "text/plain"),
            "new_file": ("new.txt", b"new content", "text/plain")
        }
        
        try:
            response = client.post("/analyze", files=files)
            
            print(f"Response status: {response.status_code}")
            print(f"Response body: {response.json()}")
            
            if response.status_code == 500:
                print("FAILED: Server returned 500 Internal Server Error (Crash still active?)")
                exit(1)
            
            if response.status_code != 503:
                 print(f"WARNING: Expected 503 for connection error, got {response.status_code}")
                 # Logic: 503 if error_type in ["connection", "timeout"] else 400
            
            json_data = response.json()
            if json_data.get("error") is not True:
                print("FAILED: Response JSON missing error: True")
                exit(1)
                
            print("SUCCESS: Endpoint returned valid JSON error response instead of crashing.")
            
        except Exception as e:
            print(f"FAILED: Exception during request: {e}")
            exit(1)

if __name__ == "__main__":
    test_crash_fix()
