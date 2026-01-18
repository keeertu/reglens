import os
import json
import logging
from openai import OpenAI

logger = logging.getLogger(__name__)

def clean_json_response(content: str) -> dict:
    """Strip markdown code blocks and parse JSON."""
    content = content.replace("```json", "").replace("```", "").strip()
    return json.loads(content or "{}")

def generate_compliance_task(change: dict) -> dict | None:
    """Decide if a change requires a compliance task. Returns Task or None."""
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        logger.error("Missing OPENROUTER_API_KEY")
        return None

    model = os.getenv("OPENROUTER_MODEL", "openai/gpt-oss-120b:free")

    try:
        client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=api_key,
        )

        prompt = f"""
You are a conservative Compliance Officer.
Analyze the following regulatory change to decide if a HUMAN ACTION (at least one compliance task) is REQUIRED.

Rules:
1. ONLY generate a task if the change creates a new obligation, modifies an existing one, or requires explicit review for risk.
2. If the change is EDITORIAL (fixing typos, reformatting, minor wording), INFO-ONLY, or CLARIFICATION -> RETURN NULL.
3. If the change does not require any specific action from a human -> RETURN NULL.
4. If uncertain or the text is vague -> RETURN NULL.
5. Do NOT hallucinate obligations, clauses, or responsibilities. Use only the provided text.

This is a compliance system, not a creative task generator. Be as conservative as possible.

Input Change:
Section: {change.get('section', 'Unknown')}
Type: {change.get('type', 'Unknown')}
Text/Diff: {change.get('after', change.get('text', ''))}

Output Format:
Return a JSON object (NO Markdown) with these fields:
{{
  "requires_task": true/false,
  "title": "Short, actionable title (max 10 words)",
  "description": "Clear instruction on what needs to be done. Max 30 words.",
  "risk_level": "Low" | "Medium" | "High"
}}
"""

        response = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            timeout=30,
        )

        content = response.choices[0].message.content
        data = clean_json_response(content)

        if data.get("requires_task"):
            return {
                "title": data.get("title", "Review Change"),
                "description": data.get("description", "Please review this regulatory change."),
                "risk_level": data.get("risk_level", "Low"),
                "change_type": change.get("type", "MODIFIED"),
                "source_clause": change.get("section", "Unknown")
            }
        
        return None

    except Exception as e:
        logger.error(f"Task Generation Failed: {e}")
        return None
