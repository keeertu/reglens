from pathlib import Path
from dotenv import load_dotenv
import logging
import asyncio
import time

# Load env vars with override to fix precedence issues
load_dotenv(Path(__file__).parent / ".env", override=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)

from fastapi import FastAPI, UploadFile, File, HTTPException, Body
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import json
import difflib
import requests
import re
import fitz  # PyMuPDF
import os
import uuid
from fpdf import FPDF
from openai import OpenAI

# Isolated LLM clients (imported after env/logging setup)
from llm_client import explain_changes
from task_client import generate_compliance_task

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # allow all origins for now
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ================= BASIC ROUTES =================

@app.get("/")
def root():
    return {
        "service": "RegLens Backend",
        "status": "running",
        "docs": "/docs"
    }

@app.get("/favicon.ico")
def favicon():
    return None # Prevent Log noise

MAX_CHANGES_FOR_LLM = 10
MAX_TEXT_LEN = 300

def extract_pdf_text(path: Path) -> str:
    doc = fitz.open(path)
    text = "\n".join(page.get_text("text") for page in doc)
    doc.close()
    return text

def normalize_text(text: str):
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    paras, buf = [], []
    for l in lines:
        buf.append(l)
        if l.endswith(".") or l.endswith(":"):
            paras.append(" ".join(buf))
            buf = []
    if buf:
        paras.append(" ".join(buf))
    return paras

def read_file(path: Path):
    if path.suffix.lower() == ".pdf":
        return normalize_text(extract_pdf_text(path))
    return normalize_text(path.read_text(errors="ignore"))

ANCHOR_REGEX = re.compile(
    r"^(chapter|section|\d+(\.\d+)+|definitions|scope|applicability)",
    re.I
)

def split_into_sections(paragraphs):
    sections, current = {}, "UNANCHORED"
    for p in paragraphs:
        if ANCHOR_REGEX.match(p.lower()):
            current = p
        sections.setdefault(current, []).append(p)
    return sections

def align_sections(old, new):
    return [(k, old[k], new[k]) for k in set(old) & set(new)]

def diff_sections(aligned):
    diffs = []
    for anchor, o, n in aligned:
        for line in difflib.unified_diff(o, n, lineterm=""):
            if line.startswith(("+", "-")) and not line.startswith(("+++", "---")):
                diffs.append((anchor, line))
    return diffs

def compress_changes(changes):
    grouped = {}
    for anchor, line in changes:
        grouped.setdefault(anchor, []).append(line)

    records = []

    for anchor, lines in grouped.items():
        plus = [l[1:].strip() for l in lines if l.startswith("+")]
        minus = [l[1:].strip() for l in lines if l.startswith("-")]

        if plus and minus:
            records.append({
                "section": anchor,
                "type": "MODIFIED",
                "before": minus[0][:MAX_TEXT_LEN],
                "after": plus[0][:MAX_TEXT_LEN],
            })
        elif plus:
            records.append({
                "section": anchor,
                "type": "ADDED",
                "text": plus[0][:MAX_TEXT_LEN],
            })
        elif minus:
            records.append({
                "section": anchor,
                "type": "REMOVED",
                "text": minus[0][:MAX_TEXT_LEN],
            })

    return records[:MAX_CHANGES_FOR_LLM]

# Global state & concurrency safety
TASK_STORE = []
LAST_ANALYSIS_CHANGES = []
LAST_ACTIVITY_TIME = time.time()
analyze_semaphore = asyncio.Semaphore(3)

def update_activity():
    global LAST_ACTIVITY_TIME
    LAST_ACTIVITY_TIME = time.time()

async def cleanup_loop():
    """Clear stale in-memory state after 30 mins of inactivity."""
    while True:
        await asyncio.sleep(300) # Check every 5 minutes
        if time.time() - LAST_ACTIVITY_TIME > 1800:
            if TASK_STORE or LAST_ANALYSIS_CHANGES:
                TASK_STORE.clear()
                LAST_ANALYSIS_CHANGES.clear()
                logging.info("In-memory state cleared due to inactivity watchdog.")

@app.on_event("startup")
async def start_cleanup_task():
    asyncio.create_task(cleanup_loop())

# Task generation logic is decoupled via task_client.py

@app.get("/llm-test")
def test_openrouter():
    try:
        api_key = os.getenv("OPENROUTER_API_KEY")
        if not api_key:
            return {"status": "error", "message": "Missing OPENROUTER_API_KEY env var"}

        client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=api_key
        )
        
        response = client.chat.completions.create(
            model="openai/gpt-oss-120b:free",
            messages=[{"role": "user", "content": "Say hello in one sentence."}],
        )
        return {"status": "success", "response": response.choices[0].message.content}
    except Exception as e:
        logging.error(f"OpenRouter Test Error: {str(e)}")
        return {
            "status": "error", 
            "message": "Failed to connect to LLM provider. Please check logs for details."
        }

@app.get("/tasks")
def get_tasks(status: str = None):
    """Fetch all tasks or filter by status (pending|approved)."""
    if status:
        filtered = [t for t in TASK_STORE if t.get("status") == status]
        return {"tasks": filtered, "count": len(filtered)}
    return {
        "tasks": TASK_STORE,
        "count": len(TASK_STORE),
    }

@app.post("/analyze")
async def analyze(old: UploadFile = File(...), new: UploadFile = File(...)):
    update_activity()
    
    # Security/Safety: Enforce concurrency cap
    if analyze_semaphore.locked():
        raise HTTPException(
            status_code=429, 
            detail="Server is busy processing other documents. Please try again in 30 seconds."
        )

    MAX_FILE_SIZE = 200 * 1024 * 1024 # 200MB
    
    # Security: Validate file sizes without loading into memory
    for file in [old, new]:
        # Check size if already known
        if file.size is not None and file.size > MAX_FILE_SIZE:
            raise HTTPException(status_code=413, detail="File too large. Maximum size is 200MB.")
        
        # Fallback: check underlying SpooledTemporaryFile (sync)
        try:
            file.file.seek(0, os.SEEK_END)
            actual_size = file.file.tell()
            file.file.seek(0)
            if actual_size > MAX_FILE_SIZE:
                raise HTTPException(status_code=413, detail="File too large. Maximum size is 200MB.")
        except Exception as e:
            logging.error(f"Size validation error: {e}")
            # If we can't determine size, we proceed but it's a risk. 
            # However, SpooledTemporaryFile usually supports this.
            pass

    # Security: Strip path components from filenames to prevent Path Traversal
    old_filename = os.path.basename(old.filename)
    new_filename = os.path.basename(new.filename)
    
    old_path = Path(f"tmp_{uuid.uuid4()}_{old_filename}")
    new_path = Path(f"tmp_{uuid.uuid4()}_{new_filename}")

    async with analyze_semaphore:
        try:
            # Write temporary files
            old_path.write_bytes(await old.read())
            new_path.write_bytes(await new.read())

            # Process files
            old_text = read_file(old_path)
            new_text = read_file(new_path)

            aligned = align_sections(
                split_into_sections(old_text),
                split_into_sections(new_text),
            )

            raw = diff_sections(aligned)
            compressed = compress_changes(raw)

            # Delegate to isolated LLM client
            explanation = explain_changes(compressed)

            # Store changes for subsequent task generation call
            global LAST_ANALYSIS_CHANGES
            LAST_ANALYSIS_CHANGES = compressed

            return {
                "summary": explanation,
                "changes": compressed,
                "task_count": len(TASK_STORE),
            }

        except Exception as e:
            logging.error(f"Analysis Failed: {str(e)}")
            raise HTTPException(status_code=500, detail="Internal server error during analysis")
        finally:
            # Prevent disk exhaustion from leftovers
            if old_path.exists(): old_path.unlink()
            if new_path.exists(): new_path.unlink()

# --- New Task System ---

@app.post("/tasks/generate")
def generate_tasks_llm(body: dict = Body(None)):
    update_activity()
    """
    Generate tasks from the latest analysis or provided changes.
    """
    changes = (body or {}).get("changes") or LAST_ANALYSIS_CHANGES
    
    TASK_STORE.clear()
    count = 0
    
    if not changes:
        return {"status": "success", "count": 0, "tasks": []}

    for change in changes:
        try:
            task_data = generate_compliance_task(change)
            if task_data:
                task_data["id"] = str(uuid.uuid4())
                task_data["status"] = "pending"
                TASK_STORE.append(task_data)
                count += 1
        except Exception:
            continue
            
    return {"status": "success", "count": count, "tasks": [t for t in TASK_STORE if t["status"] == "pending"]}

@app.post("/tasks/{task_id}/approve")
def approve_task(task_id: str):
    update_activity()
    """Mark a pending task as approved."""
    for t in TASK_STORE:
        if t.get("id") == task_id:
            t["status"] = "approved"
            return {"status": "success"}
    raise HTTPException(404, "Task not found")

@app.post("/tasks/{task_id}/reject")
def reject_task(task_id: str):
    update_activity()
    """Discard a rejected task."""
    original_len = len(TASK_STORE)
    TASK_STORE[:] = [t for t in TASK_STORE if t.get("id") != task_id]
    if len(TASK_STORE) == original_len:
         raise HTTPException(404, "Task not found")
    return {"status": "success"}

@app.get("/tasks/export")
async def export_tasks_pdf(regulation_name: str = "RegLens Compliance Audit"):
    """Export only approved tasks as a professional audit PDF."""
    approved = [t for t in TASK_STORE if t.get("status") == "approved"]
    
    # Limit filename length and remove path components
    regulation_name = os.path.basename(regulation_name)[:100]

    # Helper to handle characters that FPDF's default Arial font cannot render (non-latin-1)
    def clean(txt):
        if not txt: return ""
        return str(txt).encode("latin-1", "replace").decode("latin-1").replace("?", " ")

    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", "B", 20)
    pdf.set_text_color(31, 41, 55) # hex-like gray-800
    pdf.cell(0, 15, "RegLens Compliance Sign-off Report", ln=True, align="C")
    
    pdf.set_font("Arial", "I", 10)
    pdf.set_text_color(107, 114, 128) # gray-500
    pdf.cell(0, 8, f"Regulation: {clean(regulation_name)}", ln=True, align="C")
    
    from datetime import datetime
    date_str = datetime.now().strftime("%Y-%m-%d %H:%M")
    pdf.cell(0, 8, f"Review Date: {date_str}", ln=True, align="C")
    pdf.ln(10)
    
    pdf.set_font("Arial", "B", 12)
    pdf.set_text_color(0, 0, 0)
    pdf.cell(0, 10, "STATUS: HUMAN REVIEWED & APPROVED", ln=True)
    pdf.set_font("Arial", "", 10)
    pdf.cell(0, 8, "The following compliance tasks have been explicitly reviewed and approved by an officer.", ln=True)
    pdf.ln(5)
    
    if not approved:
        pdf.set_font("Arial", "I", 12)
        pdf.cell(0, 10, "No approved tasks available for this report cycle.", ln=True)
    
    for t in approved:
        # Card container formatting
        pdf.set_fill_color(249, 250, 251) # gray-50
        pdf.set_font("Arial", "B", 12)
        pdf.cell(0, 10, f"TASK: {clean(t.get('title', 'Untitled'))}", border='TLR', ln=True, fill=True)
        
        pdf.set_font("Arial", "I", 9)
        pdf.cell(0, 8, f"Source Clause: {clean(t.get('source_clause', 'Unknown'))} | Risk: {clean(t.get('risk_level', 'Unknown'))} | Change: {clean(t.get('change_type', 'Unknown'))}", border='LR', ln=True, fill=True)
        
        pdf.set_font("Arial", "", 11)
        pdf.multi_cell(0, 8, f"Action Required: {clean(t.get('description', ''))}", border='LRB', fill=True)
        pdf.ln(5)

    pdf.ln(20)
    pdf.set_font("Arial", "I", 8)
    pdf.set_text_color(107, 114, 128)
    pdf.cell(0, 10, "This document serves as a formal audit trail for regulatory compliance activities.", ln=True, align="C")
    pdf.cell(0, 5, "RegLens Compliance AI Assurance System - Human-Verified Output", ln=True, align="C")

    # Unique filename for concurrency; cleaned up in background
    from fastapi import BackgroundTasks
    temp_filename = f"report_{uuid.uuid4()}.pdf"
    pdf.output(temp_filename)

    def cleanup(path):
        if os.path.exists(path): os.remove(path)

    background_tasks = BackgroundTasks()
    background_tasks.add_task(cleanup, temp_filename)

    return FileResponse(
        temp_filename, 
        media_type="application/pdf", 
        filename="compliance_report.pdf",
        background=background_tasks
    )
