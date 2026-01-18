import os
import json
import logging
import time
from openai import OpenAI

logger = logging.getLogger(__name__)


def _mock_explanation(changes):
    if not changes:
        return "No actionable regulatory changes detected."
    return {
        "status": "unavailable",
        "content": (
            "Automated analysis is temporarily unavailable.\n\n"
            f"We identified {len(changes)} regulatory changes. "
            "Please review them manually for now."
        )
    }


def normalize_headings(text: str) -> str:
    """Convert bold lines to Markdown headings; keep inline bold intact."""

    lines = text.splitlines()
    normalized = []

    for line in lines:
        stripped = line.strip()

        # Match lines like: **Some Title**
        if (
            stripped.startswith("**")
            and stripped.endswith("**")
            and stripped.count("**") == 2
        ):
            title = stripped.replace("**", "").strip()

            # First title becomes H1, others H2
            if not normalized:
                normalized.append(f"# {title}")
            else:
                normalized.append(f"## {title}")
            continue

        normalized.append(line)

    return "\n".join(normalized)



def _group_changes(changes: list, batch_size: int = 3) -> list:
    """Keep changes from the same sections together in batches."""
    sections = {}
    for c in changes:
        s = c.get('section', 'General')
        sections.setdefault(s, []).append(c)
    
    batches = []
    current_batch = []
    
    for s_changes in sections.values():
        for c in s_changes:
            current_batch.append(c)
            if len(current_batch) >= batch_size:
                batches.append(current_batch)
                current_batch = []
    
    if current_batch:
        batches.append(current_batch)
    return batches

def explain_changes(changes: list) -> str | dict:
    if os.getenv("ENABLE_LLM", "true").lower() != "true":
        return _mock_explanation(changes)

    if not changes:
        return "No actionable regulatory changes detected."

    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        logger.error("Missing OPENROUTER_API_KEY environment variable")
        return _mock_explanation(changes)

    model = os.getenv("OPENROUTER_MODEL", "openai/gpt-oss-120b:free")
    
    batches = _group_changes(changes, batch_size=3)
    max_batches = 5
    results = []
    partial_failure = False

    try:
        client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=api_key,
        )

        for i, batch in enumerate(batches[:max_batches]):
            if i > 0:
                time.sleep(0.8)  # Rate-limit safety

            is_first = (i == 0)
            
            prompt = f"""
You are a senior compliance analyst.
Analyze the following regulatory changes and provide a professional markdown summary.

Rules:
1. Output MUST be clean, skimmable Markdown.
2. Use `##` for section headers. Never use `###`.
3. Keep it professional and concise.

{"Provide a document-level summary (H1) and overview first." if is_first else "This is a continuation of an analysis. Provide only section-specific details without repeating the document title."}

Changes for this batch:
{json.dumps(batch, indent=2)}
"""
            if is_first:
                prompt += """
Structure:
# Regulatory Change Summary
## Overview
(General context)
## Key Changes
(Bullets)
## Detailed Analysis
(Analysis for this batch)
"""
            else:
                prompt += "\nFormat the output as appended ## Section headers with specific analysis bullet points."

            try:
                logger.info(f"OpenRouter Batch {i+1}/{len(batches)} | model={model}")
                response = client.chat.completions.create(
                    model=model,
                    messages=[{"role": "user", "content": prompt}],
                    timeout=45,
                )
                batch_text = response.choices[0].message.content
                results.append(batch_text)

            except Exception as e:
                logger.warning(f"Batch {i+1} failed: {e}")
                partial_failure = True
                break

        if not results:
            return _mock_explanation(changes)

        combined_summary = "\n\n".join(results)
        
        # Add progressive limiting notice if applicable
        if len(batches) > max_batches or partial_failure:
            combined_summary += "\n\n---\n> [!NOTE]\n> **Additional changes were detected but deferred to manual review to ensure processing stability.**"

        return normalize_headings(combined_summary)

    except Exception:
        logger.exception("OpenRouter LLM failure")
        return _mock_explanation(changes)
