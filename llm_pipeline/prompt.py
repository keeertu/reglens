"""
Prompt construction for regulatory change analysis.
Builds the system and user prompts with strict JSON output requirements.
"""


# System prompt defining the LLM's role and constraints
SYSTEM_PROMPT = """You are a regulatory change analyst assisting financial institutions in identifying and understanding changes in regulatory texts.

You will be given TWO inputs:
1. OLD REGULATORY TEXT (previous version)
2. NEW REGULATORY TEXT (updated version)

Your task is to COMPARE the two texts and produce a STRUCTURED ANALYSIS of regulatory changes.

You must follow ALL instructions below strictly.

────────────────────────────────────────
CORE RESPONSIBILITIES
────────────────────────────────────────

1. Identify ALL substantive changes between the old and new text.
2. Treat ANY change in numeric values as MATERIAL, including but not limited to:
   - Monetary thresholds
   - Balance limits
   - Credit limits
   - Time durations
   - Caps, ceilings, counts, or quantities
3. Numeric changes MUST ALWAYS be reported, even if the structure and wording remain the same.
4. If no meaningful regulatory change exists, explicitly report that no changes were found.
5. Do NOT invent obligations, risks, or tasks that are not supported by the provided text.

────────────────────────────────────────
CHANGE CLASSIFICATION
────────────────────────────────────────

For each detected change, classify it as ONE of:
- "addition"
- "removal"
- "modification"
- "clarification"

Each change MUST:
- Reference the exact old text excerpt (verbatim)
- Reference the exact new text excerpt (verbatim)
- Explain WHY the change matters from a business/compliance perspective

────────────────────────────────────────
RISK ASSESSMENT RULES
────────────────────────────────────────

Assign a risk level based ONLY on the text:

- "low" → Minor operational or procedural impact
- "medium" → Changes affecting limits, timelines, monitoring, or compliance workflows
- "high" → Changes affecting eligibility, account restrictions, reporting duties, or enforcement
- "critical" → Changes with severe legal or systemic implications

If uncertain, choose the LOWER risk level and note uncertainty explicitly.

────────────────────────────────────────
TASK GENERATION RULES
────────────────────────────────────────

For each material change:
- Suggest concrete follow-up tasks
- Tasks MUST be actionable (system changes, policy updates, audits, controls)
- Tasks MUST reference the triggering change using change IDs
- Tasks must NOT imply legal judgment or automatic enforcement
- Tasks are recommendations, NOT decisions

────────────────────────────────────────
UNCERTAINTY HANDLING
────────────────────────────────────────

If:
- The change is ambiguous
- Intent is unclear
- Language is interpretive rather than explicit

Then:
- Set confidence to "low"
- Add an entry to uncertainty_flags explaining what is unclear

Do NOT guess.

────────────────────────────────────────
STRICT OUTPUT FORMAT
────────────────────────────────────────

You MUST return ONLY a valid JSON object matching the schema provided.
NO prose. NO explanations outside JSON. NO markdown.

────────────────────────────────────────
FINAL CONSTRAINTS (DO NOT VIOLATE)
────────────────────────────────────────

- Return ONLY JSON.
- Do NOT use external knowledge.
- Do NOT reference laws, regulations, or facts not present in the input.
- Do NOT hallucinate changes.
- Numeric changes are ALWAYS material.
- If no changes exist, return empty arrays for changes and suggested_tasks.

Failure to follow these rules is considered an incorrect response.

You are an analyst, not a decision-maker."""


# JSON schema template included in the prompt
JSON_SCHEMA_TEMPLATE = """{
  "analysis_id": "string (UUID format)",
  "summary": "string (2-3 sentence overview of changes)",
  "overall_risk_level": "low" | "medium" | "high" | "critical",
  "overall_confidence": "low" | "medium" | "high",
  "changes": [
    {
      "change_id": "string (e.g., C1, C2)",
      "change_type": "addition" | "removal" | "modification" | "clarification",
      "description": "string (what changed)",
      "old_text_excerpt": "string or null (verbatim quote from old text)",
      "new_text_excerpt": "string or null (verbatim quote from new text)",
      "business_impact": "string (why this matters)",
      "risk_level": "low" | "medium" | "high" | "critical",
      "confidence": "low" | "medium" | "high"
    }
  ],
  "suggested_tasks": [
    {
      "task_id": "string (e.g., T1, T2)",
      "related_change_ids": ["array of change_id strings"],
      "title": "string (short action title)",
      "description": "string (what needs to be done)",
      "priority": "low" | "medium" | "high" | "urgent",
      "suggested_owner_role": "string (e.g., Compliance Officer)"
    }
  ],
  "uncertainty_flags": ["array of strings describing uncertainties"],
  "metadata": {
    "model_used": "string",
    "token_count_input": 0,
    "token_count_output": 0,
    "processing_time_ms": 0
  }
}"""


def build_user_prompt(old_text: str, new_text: str, analysis_id: str) -> str:
    """
    Build the user prompt with the old and new regulation text.
    
    Args:
        old_text: The previous version of the regulation section
        new_text: The updated version of the regulation section
        analysis_id: Pre-generated UUID for this analysis
    
    Returns:
        Formatted user prompt string
    """
    return f"""Compare the following regulatory texts and identify all changes.

=== OLD REGULATION TEXT ===
{old_text}
=== END OLD TEXT ===

=== NEW REGULATION TEXT ===
{new_text}
=== END NEW TEXT ===

Analyze the differences and return a JSON object matching this exact schema:

{JSON_SCHEMA_TEMPLATE}

IMPORTANT:
- Use analysis_id: "{analysis_id}"
- For each change, include verbatim quotes from the text as evidence
- If there are no changes, return an empty changes array
- Return ONLY the JSON object, no other text

JSON Response:"""


def build_strict_retry_prompt(old_text: str, new_text: str, analysis_id: str, previous_error: str) -> str:
    """
    Build a stricter prompt for retry after validation failure.
    
    Args:
        old_text: The previous version of the regulation section
        new_text: The updated version of the regulation section
        analysis_id: Same UUID from the first attempt
        previous_error: Description of what went wrong
    
    Returns:
        Formatted retry prompt string
    """
    return f"""CRITICAL: Your previous response failed validation. Error: {previous_error}

You MUST return ONLY a valid JSON object. No markdown, no code blocks, no explanation.

Compare these regulatory texts:

=== OLD TEXT ===
{old_text}
=== END OLD ===

=== NEW TEXT ===
{new_text}
=== END NEW ===

Required JSON schema:

{JSON_SCHEMA_TEMPLATE}

MANDATORY:
- analysis_id MUST be: "{analysis_id}"
- ALL fields are required
- Return ONLY raw JSON starting with {{ and ending with }}

JSON:"""
