import sys
import json
import difflib
import requests
import re
import hashlib
from pathlib import Path
from difflib import SequenceMatcher
import fitz  # PyMuPDF

# ============================================================
# CONFIG – OPENROUTER (1 CALL PER RUN)
# ============================================================

OPENROUTER_API_KEY = "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"
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL_NAME = "deepseek/deepseek-r1-0528:free"

HEADERS = {
    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
    "Content-Type": "application/json",
    "HTTP-Referer": "http://localhost",
    "X-Title": "RegLens UltraSafe Diff"
}

MAX_CHANGES_FOR_LLM = 15     # HARD LIMIT
MAX_TEXT_LEN = 300           # chars per change

# ============================================================
# PDF EXTRACTION
# ============================================================

def extract_pdf_text(pdf_path: Path) -> str:
    doc = fitz.open(pdf_path)
    pages = [doc.load_page(i).get_text("text") for i in range(doc.page_count)]
    doc.close()
    return "\n".join(pages)

# ============================================================
# NORMALIZE
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
# ANCHOR LOGIC
# ============================================================

ANCHOR_REGEX = re.compile(
    r"^(chapter\s+\w+|section\s+\d+|\d+(\.\d+)+|definitions|applicability|scope)",
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
# DIFF
# ============================================================

def diff_sections(aligned):
    out = []
    for anchor, old_p, new_p in aligned:
        d = difflib.unified_diff(old_p, new_p, lineterm="")
        for line in d:
            if line.startswith("+") or line.startswith("-"):
                if not line.startswith(("+++","---","@@")):
                    out.append((anchor, line))
    return out

# ============================================================
# FAST FILTERS
# ============================================================

FAST_NOISE = ("page ", "copyright", "www.", "http")

def is_noise(t):
    t = t.lower()
    return len(t) < 40 or any(k in t for k in FAST_NOISE)

def dedup_hash(items):
    seen, out = set(), []
    for a, t in items:
        h = hashlib.md5(re.sub(r"\W+","",t.lower()).encode()).hexdigest()
        if h not in seen:
            seen.add(h)
            out.append((a,t))
    return out

IMPORTANT = ("shall","must","limit","penalty","effective","increase","decrease")

def score(t):
    return sum(k in t.lower() for k in IMPORTANT) + min(len(t)//200,2)

# ============================================================
# COMPRESS FOR LLM (KEY PART)
# ============================================================

def compress_changes(changes):
    """
    Turn raw +/- lines into compact change records.
    """
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

    # rank & cap
    records = sorted(records, key=lambda r: score(json.dumps(r)), reverse=True)
    return records[:MAX_CHANGES_FOR_LLM]

# ============================================================
# SINGLE LLM CALL
# ============================================================

def explain_with_openrouter(records):
    if not records:
        return (
            "SUMMARY\n"
            "-------\n"
            "No actionable regulatory changes detected.\n\n"
            "OVERALL RISK: LOW\n"
        )

    # Hard cap to stay token-safe & reliable
    records = records[:10]

    prompt = f"""
You are helping SOFTWARE ENGINEERS update regulated fintech systems.

Your task:
Convert the following regulatory changes into CLEAR, PRACTICAL
engineering instructions.

Write in SIMPLE, READABLE TEXT.
Do NOT use JSON.
Do NOT use markdown.
Use headings and bullet points.
Be specific and actionable.

Format your response EXACTLY like this:

SUMMARY
-------
<short plain-English summary>

OVERALL RISK: <Low / Medium / High>

CHANGE 1
--------
Section: <section>
Type: <ADDED / MODIFIED / REMOVED>

What changed:
<plain English>

Systems affected:
- <system 1>
- <system 2>

What engineers must do:
- <action 1>
- <action 2>

Likely code areas:
- <folder/module>
- <config/file>

Priority: <Low / Medium / High / Critical>
Owner: <Backend / Frontend / Mobile / Ops / Data / Security>

Repeat CHANGE blocks as needed.

Input regulatory changes:
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

    print(f"LLM changes sent: {len(compressed)} (1 request only)\n")

    explanation = explain_with_openrouter(compressed)
    print(explanation)

# ============================================================
# ENTRY
# ============================================================

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python pipeline_pdf_diff_anchor_openrouter_ultra_safe.py old.pdf new.pdf")
        sys.exit(1)
    main(sys.argv[1], sys.argv[2])
