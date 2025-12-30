import sys
import os
from pathlib import Path
from fastapi.testclient import TestClient

# Add project root to sys.path explicitly to allow 'from backend.main import app'
# This works regardless of where the script is run from, as long as it's in backend/
current_file = Path(__file__).resolve()
project_root = current_file.parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

try:
    from backend.main import app
except ImportError:
    # Fallback if running directly inside backend/ without parent context
    sys.path.insert(0, str(current_file.parent))
    from main import app

client = TestClient(app)

def test_endpoints():
    print("Verifying GET / ...")
    response_root = client.get("/")
    if response_root.status_code != 200:
        print(f"FAILED: GET / returned {response_root.status_code}")
        print(response_root.text)
        exit(1)
        
    json_data = response_root.json()
    if json_data.get("service") != "RegLens Backend":
        print(f"FAILED: Unexpected service name: {json_data.get('service')}")
        exit(1)
    
    print("GET / OK: 200 JSON")
    print(json_data)

    print("Verifying GET /favicon.ico ...")
    response_fav = client.get("/favicon.ico")
    if response_fav.status_code != 204:
        print(f"FAILED: GET /favicon.ico returned {response_fav.status_code}")
        exit(1)
        
    if response_fav.content:
        print("FAILED: GET /favicon.ico returned content")
        exit(1)
        
    print("GET /favicon.ico OK: 204 No Content")

if __name__ == "__main__":
    try:
        test_endpoints()
        print("VERIFICATION SUCCESSFUL")
    except Exception as e:
        print(f"VERIFICATION FAILED: {e}")
        exit(1)
