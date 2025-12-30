"""
JSON schema definition and validation for LLM analysis output.
Validates that LLM responses conform to the approved schema.
"""

import uuid
from typing import Any


# Valid enum values
VALID_RISK_LEVELS = {"low", "medium", "high", "critical"}
VALID_CONFIDENCE_LEVELS = {"low", "medium", "high"}
VALID_CHANGE_TYPES = {"addition", "removal", "modification", "clarification"}
VALID_PRIORITY_LEVELS = {"low", "medium", "high", "urgent"}


def generate_analysis_id() -> str:
    """Generate a unique analysis ID."""
    return str(uuid.uuid4())


def validate_enum(value: Any, valid_values: set, field_name: str) -> list[str]:
    """Validate that a value is one of the allowed enum values."""
    errors = []
    if not isinstance(value, str):
        errors.append(f"{field_name}: expected string, got {type(value).__name__}")
    elif value.lower() not in valid_values:
        errors.append(f"{field_name}: '{value}' not in {valid_values}")
    return errors


def validate_change_item(change: dict, index: int) -> list[str]:
    """Validate a single change item in the changes array."""
    errors = []
    prefix = f"changes[{index}]"
    
    # Required string fields
    required_strings = ["change_id", "description", "business_impact"]
    for field in required_strings:
        if field not in change:
            errors.append(f"{prefix}.{field}: missing required field")
        elif not isinstance(change[field], str):
            errors.append(f"{prefix}.{field}: expected string")
    
    # Enum fields
    if "change_type" in change:
        errors.extend(validate_enum(change["change_type"], VALID_CHANGE_TYPES, f"{prefix}.change_type"))
    else:
        errors.append(f"{prefix}.change_type: missing required field")
    
    if "risk_level" in change:
        errors.extend(validate_enum(change["risk_level"], VALID_RISK_LEVELS, f"{prefix}.risk_level"))
    else:
        errors.append(f"{prefix}.risk_level: missing required field")
    
    if "confidence" in change:
        errors.extend(validate_enum(change["confidence"], VALID_CONFIDENCE_LEVELS, f"{prefix}.confidence"))
    else:
        errors.append(f"{prefix}.confidence: missing required field")
    
    # Optional excerpt fields (can be string or null)
    for field in ["old_text_excerpt", "new_text_excerpt"]:
        if field in change and change[field] is not None and not isinstance(change[field], str):
            errors.append(f"{prefix}.{field}: expected string or null")
    
    return errors


def validate_task_item(task: dict, index: int, valid_change_ids: set) -> list[str]:
    """Validate a single task item in the suggested_tasks array."""
    errors = []
    prefix = f"suggested_tasks[{index}]"
    
    # Required string fields
    required_strings = ["task_id", "title", "description", "suggested_owner_role"]
    for field in required_strings:
        if field not in task:
            errors.append(f"{prefix}.{field}: missing required field")
        elif not isinstance(task[field], str):
            errors.append(f"{prefix}.{field}: expected string")
    
    # Priority enum
    if "priority" in task:
        errors.extend(validate_enum(task["priority"], VALID_PRIORITY_LEVELS, f"{prefix}.priority"))
    else:
        errors.append(f"{prefix}.priority: missing required field")
    
    # Related change IDs validation
    if "related_change_ids" in task:
        if not isinstance(task["related_change_ids"], list):
            errors.append(f"{prefix}.related_change_ids: expected array")
        else:
            for i, cid in enumerate(task["related_change_ids"]):
                if not isinstance(cid, str):
                    errors.append(f"{prefix}.related_change_ids[{i}]: expected string")
                elif cid not in valid_change_ids:
                    errors.append(f"{prefix}.related_change_ids[{i}]: '{cid}' not found in changes")
    else:
        errors.append(f"{prefix}.related_change_ids: missing required field")
    
    return errors


def validate_metadata(metadata: dict) -> list[str]:
    """Validate the metadata object."""
    errors = []
    
    if not isinstance(metadata, dict):
        return ["metadata: expected object"]
    
    # Required metadata fields
    if "model_used" not in metadata:
        errors.append("metadata.model_used: missing required field")
    elif not isinstance(metadata["model_used"], str):
        errors.append("metadata.model_used: expected string")
    
    # Optional integer fields
    for field in ["token_count_input", "token_count_output", "processing_time_ms"]:
        if field in metadata and not isinstance(metadata[field], (int, float)):
            errors.append(f"metadata.{field}: expected integer")
    
    return errors


def validate_analysis_response(response: dict) -> tuple[bool, list[str]]:
    """
    Validate the complete analysis response against the schema.
    
    Returns:
        Tuple of (is_valid, list_of_errors)
    """
    errors = []
    
    if not isinstance(response, dict):
        return False, ["Response must be a JSON object"]
    
    # Required top-level string fields
    for field in ["analysis_id", "summary"]:
        if field not in response:
            errors.append(f"{field}: missing required field")
        elif not isinstance(response[field], str):
            errors.append(f"{field}: expected string")
        elif field == "summary" and len(response[field].strip()) == 0:
            errors.append(f"{field}: cannot be empty")
    
    # Top-level enum fields
    if "overall_risk_level" in response:
        errors.extend(validate_enum(
            response["overall_risk_level"], 
            VALID_RISK_LEVELS, 
            "overall_risk_level"
        ))
    else:
        errors.append("overall_risk_level: missing required field")
    
    if "overall_confidence" in response:
        errors.extend(validate_enum(
            response["overall_confidence"], 
            VALID_CONFIDENCE_LEVELS, 
            "overall_confidence"
        ))
    else:
        errors.append("overall_confidence: missing required field")
    
    # Validate changes array
    valid_change_ids = set()
    if "changes" not in response:
        errors.append("changes: missing required field")
    elif not isinstance(response["changes"], list):
        errors.append("changes: expected array")
    else:
        for i, change in enumerate(response["changes"]):
            if isinstance(change, dict):
                errors.extend(validate_change_item(change, i))
                if "change_id" in change and isinstance(change["change_id"], str):
                    valid_change_ids.add(change["change_id"])
            else:
                errors.append(f"changes[{i}]: expected object")
    
    # Validate suggested_tasks array
    if "suggested_tasks" not in response:
        errors.append("suggested_tasks: missing required field")
    elif not isinstance(response["suggested_tasks"], list):
        errors.append("suggested_tasks: expected array")
    else:
        for i, task in enumerate(response["suggested_tasks"]):
            if isinstance(task, dict):
                errors.extend(validate_task_item(task, i, valid_change_ids))
            else:
                errors.append(f"suggested_tasks[{i}]: expected object")
    
    # Validate uncertainty_flags array
    if "uncertainty_flags" not in response:
        errors.append("uncertainty_flags: missing required field")
    elif not isinstance(response["uncertainty_flags"], list):
        errors.append("uncertainty_flags: expected array")
    else:
        for i, flag in enumerate(response["uncertainty_flags"]):
            if not isinstance(flag, str):
                errors.append(f"uncertainty_flags[{i}]: expected string")
    
    # Validate metadata
    if "metadata" not in response:
        errors.append("metadata: missing required field")
    else:
        errors.extend(validate_metadata(response["metadata"]))
    
    return len(errors) == 0, errors


def create_error_response(
    error_type: str,
    error_message: str,
    raw_output: str = None,
    retry_attempted: bool = False
) -> dict:
    """Create a standardized error response object."""
    return {
        "error": True,
        "error_type": error_type,
        "error_message": error_message,
        "raw_output": raw_output,
        "retry_attempted": retry_attempted
    }
