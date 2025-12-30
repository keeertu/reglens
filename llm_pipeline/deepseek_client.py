"""
DeepSeek API client for regulatory analysis.
Replaces the local Ollama client.
"""

import os
import json
import logging
import requests
import time
from typing import Tuple, Dict, Any, Optional

from config import REQUEST_TIMEOUT_SECONDS
from schema import extract_json_from_response as schema_extract_json

# Configure logging
logger = logging.getLogger(__name__)

DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions"
DEFAULT_MODEL = "deepseek-chat"

class DeepSeekError(Exception):
    """Base exception for DeepSeek API errors."""
    pass

def call_deepseek(
    prompt: str,
    system_prompt: str,
    model: str = DEFAULT_MODEL
) -> Tuple[str, Dict[str, Any]]:
    """
    Call DeepSeek API to generate analysis.
    
    Args:
        prompt: The user prompt
        system_prompt: The system prompt
        model: Model identifier
        
    Returns:
        Tuple of (response_text, metadata_dict)
        
    Raises:
        DeepSeekError: On API failures
    """
    api_key = os.environ.get("DEEPSEEK_API_KEY")
    if not api_key:
        raise DeepSeekError("DEEPSEEK_API_KEY environment variable not set")

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }

    # DeepSeek typically supports OpenAI-compatible chat completions
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.1,  # Low temp for deterministic output
        "max_tokens": 4096,
        "stream": False,
        "response_format": {"type": "json_object"}  # Enforce JSON mode if supported
    }

    start_time = time.time()
    
    try:
        response = requests.post(
            DEEPSEEK_API_URL,
            headers=headers,
            json=payload,
            timeout=REQUEST_TIMEOUT_SECONDS
        )
        
        if response.status_code != 200:
            error_msg = f"DeepSeek API Error {response.status_code}: {response.text}"
            logger.error(error_msg)
            raise DeepSeekError(error_msg)
            
        result = response.json()
        
        # Extract content
        try:
            choice = result["choices"][0]
            response_text = choice["message"]["content"]
            usage = result.get("usage", {})
        except (KeyError, IndexError) as e:
            raise DeepSeekError(f"Unexpected response format from DeepSeek: {e}")

        # Metadata
        duration_ms = int((time.time() - start_time) * 1000)
        metadata = {
            "model_used": model,
            "provider": "deepseek",
            "token_count_input": usage.get("prompt_tokens", 0),
            "token_count_output": usage.get("completion_tokens", 0),
            "processing_time_ms": duration_ms
        }
        
        return response_text, metadata

    except requests.exceptions.Timeout:
        raise DeepSeekError(f"Request timed out after {REQUEST_TIMEOUT_SECONDS}s")
    except requests.exceptions.RequestException as e:
        raise DeepSeekError(f"Connection error: {str(e)}")

# Re-export extraction logic to maintain interface compatibility if needed
# But analyze.py typically imports it from schema or ollama_client. 
# We should probably consolidate. For now, we rely on the one in schema.py or duplicate?
# The user prompt said: "Ensure output conforms EXACTLY". 
# The existing analyze.py imports `extract_json_from_response` from `ollama_client`.
# We should provide it here too to match the interface needed by `analyze.py` if we switch the import.
# Wait, `analyze.py` imports `extract_json_from_response` from `ollama_client`. 
# We should make sure we provide a compatible function or update analyze.py to use `schema.py` or this one.
# Looking at analyze.py: `from ollama_client import extract_json_from_response`
# So we need it here.

# Re-export extraction logic from schema to maintain interface compatibility
from schema import extract_json_from_response
