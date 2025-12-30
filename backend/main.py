from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from pathlib import Path
import json
import difflib
import requests
import re
import hashlib
import fitz  # PyMuPDF
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ================= BASIC ROUTES =================

@app.get("/")
def root():
    return {"service": "RegLens Backend", "status": "running", "docs": "/docs"}

@app.get("/favicon.ico")
def favicon():
    return None

# ================= CONFIG =================

OPENROUTER_API_KEY="xyz"
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL_NAME = "deepseek/deepseek-r1-0528:free"

HEADERS = {
    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
    "Content-Type": "application/json",
}

MAX_CHANGES_FOR_LLM = 10
MAX_TEXT_LEN = 300

# ================= FILE HANDLING =================

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

# ================= DIFF LOGIC =================

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
    records = []
    for anchor, line in changes[:MAX_CHANGES_FOR_LLM]:
        records.append({"section": anchor, "change": line[:MAX_TEXT_LEN]})
    return records

# ================= LLM =================

def explain_with_openrouter(records):
    if not records:
        return "No actionable regulatory changes detected."

    payload = {
        "model": MODEL_NAME,
        "messages": [
            {"role": "user", "content": f"Explain changes:\n{json.dumps(records)}"}
        ],
    }

    r = requests.post(OPENROUTER_URL, headers=HEADERS, json=payload, timeout=60)
    r.raise_for_status()
    return r.json()["choices"][0]["message"]["content"]

# ================= API ENDPOINT =================

@app.post("/analyze")
async def analyze(old: UploadFile = File(...), new: UploadFile = File(...)):
    try:
        old_path = Path(f"tmp_{old.filename}")
        new_path = Path(f"tmp_{new.filename}")

        old_path.write_bytes(await old.read())
        new_path.write_bytes(await new.read())

        old_text = read_file(old_path)
        new_text = read_file(new_path)

        aligned = align_sections(
            split_into_sections(old_text),
            split_into_sections(new_text),
        )

        raw = diff_sections(aligned)
        compressed = compress_changes(raw)
        explanation = explain_with_openrouter(compressed)

        return {
            "summary": explanation,
            "changes": compressed,
            "metadata": {"model": MODEL_NAME},
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
