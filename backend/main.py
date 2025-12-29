import os
import shutil
import json
import datetime
import uuid
from pathlib import Path
from urllib.parse import unquote
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Path as PathParam, Header, Depends
from pydantic import BaseModel

app = FastAPI(title="RegLens MVP")

# Configuration
DATA_DIR = Path("./data")
STATE_DIR = Path("./state")
AUDIT_LOG_FILE = Path("./audit.log")
ANALYSIS_FILE = STATE_DIR / "analysis_results.json"
TASKS_FILE = STATE_DIR / "tasks.json"

# Initialization
DATA_DIR.mkdir(parents=True, exist_ok=True)
STATE_DIR.mkdir(parents=True, exist_ok=True)

# Helper Functions
def log_audit(action: str, payload: dict, user: str = "anonymous"):
    timestamp = datetime.datetime.now().isoformat()
    # Inject user into payload to preserve "timestamp | action | payload" format
    payload_with_user = payload.copy()
    payload_with_user["user"] = user
    
    entry = f"{timestamp} | {action} | {json.dumps(payload_with_user)}\n"
    with open(AUDIT_LOG_FILE, "a") as f:
        f.write(entry)

def save_json(path: Path, data: Any):
    # Atomic write: write to tmp then rename
    tmp_path = path.with_suffix(".tmp")
    try:
        with open(tmp_path, "w") as f:
            json.dump(data, f, indent=2)
        os.replace(tmp_path, path)
    except Exception as e:
        if tmp_path.exists():
            os.remove(tmp_path)
        raise e

def load_json(path: Path, default_value: Any) -> Any:
    # Robust read with auto-recovery
    if not path.exists():
        save_json(path, default_value)
        return default_value
    
    try:
        with open(path, "r") as f:
            return json.load(f)
    except Exception as e:
        # Log corruption and reset
        log_audit("state_corruption_detected", {
            "file": str(path), 
            "error": str(e),
            "action": "reset_to_default"
        }, user="system")
        save_json(path, default_value)
        return default_value

# Initial State Checks
if not ANALYSIS_FILE.exists():
    save_json(ANALYSIS_FILE, {})

if not TASKS_FILE.exists():
    save_json(TASKS_FILE, [])

# Dependencies
async def get_current_user(x_demo_user: Optional[str] = Header(None, alias="X-Demo-User")) -> str:
    return x_demo_user or "anonymous"

# Models
class ApprovalRequest(BaseModel):
    approved_by: str

# Endpoints
@app.get("/health")
async def health_check(user: str = Depends(get_current_user)):
    log_audit("health_check", {"status": "ok"}, user=user)
    return {"status": "ok"}

@app.post("/documents/upload")
async def upload_document(
    file: UploadFile = File(...),
    title: str = Form(...),
    version: str = Form(...),
    user: str = Depends(get_current_user)
):
    try:
        # P0 FIX: Path Traversal Protection
        safe_filename = os.path.basename(file.filename)
        file_path = DATA_DIR / safe_filename
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        log_audit("upload_document", {
            "original_filename": file.filename,
            "filename": safe_filename,
            "title": title,
            "version": version,
            "path": str(file_path)
        }, user=user)
        return {"message": "File uploaded successfully", "filename": safe_filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/documents/list")
async def list_documents(user: str = Depends(get_current_user)):
    files = []
    if DATA_DIR.exists():
        files = [f.name for f in DATA_DIR.iterdir() if f.is_file()]
    log_audit("list_documents", {"count": len(files)}, user=user)
    return {"files": files}

@app.get("/changes/mock")
async def get_mock_changes(user: str = Depends(get_current_user)):
    changes = [
        {
            "regulation_id": "RBI-KYC-2025-01",
            "title": "Master Direction - KYC (Amendment)",
            "section": "Sec 12.3 (e-KYC Limits)",
            "change_type": "Modified",
            "risk_level": "High",
            "summary": "Limit for OTP-based e-KYC enhanced from Rs. 60,000 to Rs. 1,00,000."
        },
        {
            "regulation_id": "RBI-SRO-2025-04",
            "title": "Fintech SRO Framework",
            "section": "Membership Criteria",
            "change_type": "Added",
            "risk_level": "Medium",
            "summary": "Mandates 30% membership from payment aggregators."
        }
    ]
    log_audit("get_changes_mock", {"returned_count": len(changes)}, user=user)
    return {"changes": changes}

@app.get("/analyze/{filename}")
async def analyze_document(
    filename: str = PathParam(..., description="Name of the file to analyze"),
    user: str = Depends(get_current_user)
):
    decoded_filename = os.path.basename(unquote(filename))
    file_path = DATA_DIR / decoded_filename
    
    if not file_path.exists():
        log_audit("analyze_document_failed", {"filename": decoded_filename, "reason": "file_not_found"}, user=user)
        raise HTTPException(status_code=404, detail=f"File {decoded_filename} not found.")

    # Mock Analysis Logic
    analysis = {
        "document_name": decoded_filename,
        "regulator": "RBI",
        "detected_changes": [
            {
                "section": "Para 4.2",
                "original_text": "Banks must report fraud within 7 days.",
                "new_text": "Banks must report fraud within 24 hours.",
                "implication": "Operational SLA tightening."
            }
        ],
        "recommended_tasks": [
            {
                "team": "Compliance",
                "action": "Update Fraud Reporting SLA Policy",
                "priority": "Critical"
            },
            {
                "team": "Engineering",
                "action": "Configure 24h alert triggers in transaction monitoring system",
                "priority": "High"
            }
        ],
        "confidence_note": "AI-assisted analysis. Requires human verification.",
        "analysis_timestamp": datetime.datetime.now().isoformat()
    }

    # Persist Analysis (Robust)
    all_analysis = load_json(ANALYSIS_FILE, {})
    all_analysis[decoded_filename] = analysis
    save_json(ANALYSIS_FILE, all_analysis)
    
    log_audit("analyze_document", {"filename": decoded_filename, "status": "persisted"}, user=user)
    return analysis

@app.get("/tasks/mock")
async def get_mock_tasks(user: str = Depends(get_current_user)):
    # Load persistence files (Robust)
    all_analysis = load_json(ANALYSIS_FILE, {})
    current_tasks = load_json(TASKS_FILE, [])
    
    existing_task_keys = set((t["filename"], t["description"]) for t in current_tasks)
    new_tasks_added = False

    # Generate tasks from Analysis
    for filename, analysis_data in all_analysis.items():
        for rec_task in analysis_data.get("recommended_tasks", []):
            task_key = (filename, rec_task["action"])
            
            if task_key not in existing_task_keys:
                new_task = {
                    "task_id": f"TSK-{uuid.uuid4().hex[:8].upper()}",
                    "filename": filename,
                    "description": rec_task["action"],
                    "team": rec_task["team"],
                    "status": "Pending",
                    "priority": rec_task["priority"],
                    "created_at": datetime.datetime.now().isoformat()
                }
                current_tasks.append(new_task)
                existing_task_keys.add(task_key)
                new_tasks_added = True

    if new_tasks_added:
        save_json(TASKS_FILE, current_tasks)
        log_audit("tasks_generated", {"count": len(current_tasks), "status": "updated"}, user=user)
    else:
        log_audit("tasks_viewed", {"count": len(current_tasks), "status": "no_change"}, user=user)

    return {"tasks": current_tasks}

@app.post("/tasks/{task_id}/approve")
async def approve_task(
    task_id: str, 
    request: ApprovalRequest,
    user: str = Depends(get_current_user)
):
    current_tasks = load_json(TASKS_FILE, [])
    task_found = False
    updated_task = None

    for task in current_tasks:
        if task["task_id"] == task_id:
            task["status"] = "Approved"
            task["approved_by"] = request.approved_by
            task["approved_at"] = datetime.datetime.now().isoformat()
            task_found = True
            updated_task = task
            break
    
    if not task_found:
        log_audit("approve_task_failed", {"task_id": task_id, "reason": "not_found"}, user=user)
        raise HTTPException(status_code=404, detail="Task not found")

    save_json(TASKS_FILE, current_tasks)

    log_audit("approve_task", {
        "task_id": task_id,
        "approved_by": request.approved_by,
        "action": "task_approved"
    }, user=user)
    
    return updated_task

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
