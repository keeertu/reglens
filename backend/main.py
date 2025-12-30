import sys
import os
import json
import difflib
import requests
import re
import hashlib
from pathlib import Path
import fitz  # PyMuPDF

# ============================================================
# LOAD API KEY SAFELY (NO HARDCODING)
# ============================================================

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

if not OPENROUTER_API_KEY:
    raise RuntimeError(
        "OPENROUTER_API_KEY is not set.\n"
        "Set it as an environment variable before running."
    )

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL_NAME = "deepseek/deepseek-r1-0528:free"

HEADERS = {
    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
    "Content-Type": "application/json",
    "HTTP-Referer": "http://localhost",
    "X-Title": "RegLens Engineer Diff"
}

# HARD SAFETY LIMITS
MAX_CHANGES_FOR_LLM = 10
MAX_TEXT_LEN = 300

# ============================================================
# PDF EXTRACTION (500+ PAGE SAFE)
# ============================================================

def extract_pdf_text(pdf_path: Path) -> str:
    doc = fitz.open(pdf_path)
    pages = [doc.load_page(i).get_text("text") for i in range(doc.page_count)]
    doc.close()
    return "\n".join(pages)

# ============================================================
# NORMALIZE → PARAGRAPHS
# ============================================================

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

# ============================================================
# ANCHOR-BASED SECTIONING
# ============================================================

ANCHOR_REGEX = re.compile(
    r"^(chapter\s+\w+|section\s+\d+|\d+(\.\d+)+|definitions|scope|applicability)",
    re.IGNORECASE
)

def split_into_sections(paragraphs):
    sections = {}
    current = "UNANCHORED"
    for p in paragraphs:
        if ANCHOR_REGEX.match(p.lower()):
            current = p.strip()
            sections.setdefault(current, [])
        else:
            sections.setdefault(current, []).append(p.strip())
    return sections

def align_sections(old, new):
    return [(k, old[k], new[k]) for k in set(old) & set(new)]

# ============================================================
# DIFF SECTIONS
# ============================================================

def diff_sections(aligned):
    diffs = []
    for anchor, old_p, new_p in aligned:
        d = difflib.unified_diff(old_p, new_p, lineterm="")
        for line in d:
            if line.startswith(("+", "-")) and not line.startswith(("+++","---","@@")):
                diffs.append((anchor, line))
    return diffs

# ============================================================
# FAST FILTERS (PERFORMANCE SAFE)
# ============================================================

FAST_NOISE = ("page ", "copyright", "www.", "http")

def is_noise(text):
    t = text.lower()
    return len(t) < 40 or any(k in t for k in FAST_NOISE)

def dedup_hash(items):
    seen, out = set(), []
    for a, t in items:
        h = hashlib.md5(re.sub(r"\W+", "", t.lower()).encode()).hexdigest()
        if h not in seen:
            seen.add(h)
            out.append((a, t))
    return out

IMPORTANT = ("shall","must","limit","penalty","effective","increase","decrease")

def score(text):
    return sum(k in text.lower() for k in IMPORTANT) + min(len(text)//200, 2)

# ============================================================
# COMPRESS CHANGES (LLM-SAFE)
# ============================================================

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
                "after": plus[0][:MAX_TEXT_LEN]
            })
        elif plus:
            records.append({
                "section": anchor,
                "type": "ADDED",
                "text": plus[0][:MAX_TEXT_LEN]
            })
        elif minus:
            records.append({
                "section": anchor,
                "type": "REMOVED",
                "text": minus[0][:MAX_TEXT_LEN]
            })

    records = sorted(records, key=lambda r: score(json.dumps(r)), reverse=True)
    return records[:MAX_CHANGES_FOR_LLM]

# ============================================================
# LLM OUTPUT (ENGINEER-READABLE TEXT)
# ============================================================

def explain_with_openrouter(records):
    if not records:
        return (
            "SUMMARY\n"
            "-------\n"
            "No actionable regulatory changes detected.\n\n"
            "OVERALL RISK: LOW\n"
        )

    prompt = f"""
You are helping SOFTWARE ENGINEERS update regulated fintech systems.

Convert the following regulatory changes into CLEAR, PRACTICAL
engineering instructions.

Write in SIMPLE, READABLE TEXT.
Do NOT use JSON.
Do NOT use markdown.
Use headings and bullet points.

Format EXACTLY like this:

SUMMARY
-------
<short summary>

OVERALL RISK: <Low / Medium / High>

CHANGE 1
--------
Section: <section>
Type: <ADDED / MODIFIED / REMOVED>

What changed:
<plain English>

Systems affected:
- <system>

What engineers must do:
- <action>

Likely code areas:
- <folder/module>

Priority: <Low / Medium / High / Critical>
Owner: <Backend / Frontend / Mobile / Ops / Data / Security>

Input changes:
{json.dumps(records, indent=2)}
"""

    payload = {
        "model": MODEL_NAME,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.5
    }

    r = requests.post(
        OPENROUTER_URL,
        headers=HEADERS,
        data=json.dumps(payload),
        timeout=120
    )

    if r.status_code != 200:
        raise RuntimeError(r.text)

    content = r.json()["choices"][0]["message"].get("content", "").strip()
    if not content:
        raise RuntimeError("LLM returned empty content")

    return content

# ============================================================
# MAIN
# ============================================================

def main(old_pdf, new_pdf):
    old = normalize_text(extract_pdf_text(Path(old_pdf)))
    new = normalize_text(extract_pdf_text(Path(new_pdf)))

    aligned = align_sections(
        split_into_sections(old),
        split_into_sections(new)
    )

    raw = diff_sections(aligned)
    raw = [(a,t) for a,t in raw if not is_noise(t)]
    raw = dedup_hash(raw)

    compressed = compress_changes(raw)

    print(f"\nLLM changes sent: {len(compressed)} (1 request)\n")
    output = explain_with_openrouter(compressed)
    print(output)

# ============================================================
# ENTRY POINT
# ============================================================

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python main.py <old.pdf> <new.pdf>")
        sys.exit(1)

    main(sys.argv[1], sys.argv[2])
