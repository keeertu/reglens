"""
Ollama API client for interacting with the local LLM.
Handles HTTP requests, response parsing, and connection errors.
"""

import ast
import json
import re
import requests
from typing import Optional

from config import OLLAMA_GENERATE_ENDPOINT, REQUEST_TIMEOUT_SECONDS, DEFAULT_MODEL


class OllamaError(Exception):
    """Base exception for Ollama-related errors."""
    pass


class OllamaConnectionError(OllamaError):
    """Raised when Ollama server is not reachable."""
    pass


class OllamaModelError(OllamaError):
    """Raised when the requested model is not available."""
    pass


class OllamaTimeoutError(OllamaError):
    """Raised when the request times out."""
    pass


def call_ollama(
    prompt: str,
    system_prompt: str,
    model: str = DEFAULT_MODEL
) -> tuple[str, dict]:
    """
    Send a prompt to Ollama and get the response.
    
    Args:
        prompt: The user prompt to send
        system_prompt: The system prompt defining LLM behavior
        model: Model name to use (default from config)
    
    Returns:
        Tuple of (response_text, metadata_dict)
    
    Raises:
        OllamaConnectionError: If server is not reachable
        OllamaModelError: If model is not available
        OllamaTimeoutError: If request times out
    """
    payload = {
        "model": model,
        "prompt": prompt,
        "system": system_prompt,
        "stream": False,  # Get complete response at once
        "options": {
            "temperature": 0.1,  # Low temperature for consistent output
            "num_predict": 4096  # Max tokens to generate
        }
    }
    
    try:
        response = requests.post(
            OLLAMA_GENERATE_ENDPOINT,
            json=payload,
            timeout=REQUEST_TIMEOUT_SECONDS
        )
    except requests.exceptions.ConnectionError:
        raise OllamaConnectionError(
            "Ollama is not running. Start with: ollama serve"
        )
    except requests.exceptions.Timeout:
        raise OllamaTimeoutError(
            f"Request timed out after {REQUEST_TIMEOUT_SECONDS} seconds. "
            "The model may be overloaded."
        )
    
    # Check for model not found error
    if response.status_code == 404:
        raise OllamaModelError(
            f"Model '{model}' not found. "
            f"Pull it with: ollama pull {model}\n"
            f"Or list available models with: ollama list"
        )
    
    # Check for other HTTP errors
    if response.status_code != 200:
        raise OllamaError(
            f"Ollama returned status {response.status_code}: {response.text}"
        )
    
    # Parse response
    try:
        result = response.json()
    except json.JSONDecodeError:
        raise OllamaError(f"Invalid JSON from Ollama: {response.text[:200]}")
    
    response_text = result.get("response", "")
    
    # Extract metadata for tracking
    metadata = {
        "model_used": model,
        "token_count_input": result.get("prompt_eval_count", 0),
        "token_count_output": result.get("eval_count", 0),
        "processing_time_ms": int(result.get("total_duration", 0) / 1_000_000)  # ns to ms
    }
    
    return response_text, metadata


def extract_json_from_response(response_text: str) -> Optional[dict]:
    """
    Attempt to extract and parse JSON from LLM response.
    Handles cases where LLM wraps JSON in markdown code blocks.
    Falls back to ast.literal_eval for malformed JSON (e.g., single quotes).
    
    Args:
        response_text: Raw text response from LLM
    
    Returns:
        Parsed JSON dict if successful, None if parsing fails
    """
    text = response_text.strip()
    
    # Attempt 1: Direct JSON parse
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    
    # Attempt 2: Extract from markdown code blocks
    # Matches ```json ... ``` or ``` ... ```
    code_block_pattern = r'```(?:json)?\s*([\s\S]*?)\s*```'
    matches = re.findall(code_block_pattern, text)
    for match in matches:
        try:
            return json.loads(match.strip())
        except json.JSONDecodeError:
            continue
    
    # Attempt 3: Find JSON object boundaries
    # Look for outermost { and }
    first_brace = text.find('{')
    last_brace = text.rfind('}')
    
    potential_json = None
    if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
        potential_json = text[first_brace:last_brace + 1]
        try:
            return json.loads(potential_json)
        except json.JSONDecodeError:
            pass
    
    # Attempt 4: Safe fallback using ast.literal_eval
    # This handles malformed JSON like single-quoted strings
    # Only attempt if we found a dict-like structure
    if potential_json and potential_json.strip().startswith('{'):
        try:
            # ast.literal_eval safely evaluates Python literals (no code execution)
            result = ast.literal_eval(potential_json)
            
            # Accept only if result is a dict
            if isinstance(result, dict):
                print("Warning: Strict JSON parsing failed. Recovered using ast.literal_eval fallback.")
                # Normalize back to valid JSON by round-tripping through json.dumps
                normalized = json.dumps(result, ensure_ascii=False)
                return json.loads(normalized)
        except (ValueError, SyntaxError):
            # ast.literal_eval failed - structure is not valid Python literal either
            pass
    
    # All attempts failed
    return None

