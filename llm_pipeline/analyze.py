#!/usr/bin/env python3
"""
Main entry point for the LLM regulatory change analysis pipeline.
Reads input files, calls Ollama, validates output, and saves results.

Usage:
    python analyze.py --old inputs/old.txt --new inputs/new.txt
    python analyze.py --old inputs/old.txt --new inputs/new.txt --output results.json
"""

import argparse
import json
import os
import sys
import time
from datetime import datetime
from pathlib import Path

from config import (
    MAX_INPUT_CHARACTERS,
    MAX_COMBINED_CHARACTERS,
    OUTPUT_DIRECTORY,
    MAX_RETRIES,
    DEFAULT_MODEL
)
from schema import (
    generate_analysis_id,
    validate_analysis_response,
    create_error_response
)
from prompt import (
    SYSTEM_PROMPT,
    build_user_prompt,
    build_strict_retry_prompt
)
from pdf_utils import extract_text_from_pdf
from deepseek_client import (
    call_deepseek,
    extract_json_from_response,
    DeepSeekError
)

def read_input_file(filepath: str) -> str:
    """
    Read and validate an input file (Text or PDF).
    """
    path = Path(filepath)
    
    if not path.exists():
        raise FileNotFoundError(f"Input file not found: {filepath}")
    
    if not path.is_file():
        raise ValueError(f"Path is not a file: {filepath}")
    
    suffix = path.suffix.lower()
    
    try:
        if suffix == '.pdf':
            content = extract_text_from_pdf(str(path))
        else:
            # Default to text
            content = path.read_text(encoding="utf-8")
    except Exception as e:
        raise ValueError(f"Failed to read file {filepath}: {str(e)}")
    
    if len(content.strip()) == 0:
        raise ValueError(f"Input file is empty: {filepath}")
    
    if len(content) > MAX_INPUT_CHARACTERS:
        original_size = len(content)
        print(f"Warning: '{filepath}' truncated from {original_size} to {MAX_INPUT_CHARACTERS} characters")
        content = content[:MAX_INPUT_CHARACTERS] + "\n[...truncated...]"
    
    return content

# ... [save_output is unchanged] ...

def run_analysis(
    old_text: str,
    new_text: str,
    model: str = "deepseek-chat" # Default to chat model
) -> dict:
    """
    Run the complete analysis pipeline using DeepSeek.
    """
    analysis_id = generate_analysis_id()
    start_time = time.time()
    
    # Check combined input size
    combined_length = len(old_text) + len(new_text)
    if combined_length > MAX_COMBINED_CHARACTERS:
        print(f"Warning: Combined input ({combined_length} chars) exceeds limit")
    
    # Build initial prompt
    user_prompt = build_user_prompt(old_text, new_text, analysis_id)
    
    # Attempt analysis
    last_error = None
    raw_output = None
    
    # Simple retry loop
    for attempt in range(1 + MAX_RETRIES):
        is_retry = attempt > 0
        
        if is_retry:
            print(f"Retry attempt {attempt}...")
            user_prompt = build_strict_retry_prompt(
                old_text, new_text, analysis_id, str(last_error)
            )
        
        try:
            # Call DeepSeek
            response_text, metadata = call_deepseek(
                prompt=user_prompt,
                system_prompt=SYSTEM_PROMPT,
                model=model
            )
            raw_output = response_text
            
            # Extract JSON from response
            parsed = extract_json_from_response(response_text)
            if parsed is None:
                last_error = "Could not parse JSON from response"
                continue
            
            # Validate against schema
            is_valid, errors = validate_analysis_response(parsed)
            if not is_valid:
                last_error = f"Schema validation failed: {errors[:3]}"  # First 3 errors
                continue
            
            # Success - update metadata
            parsed["metadata"] = metadata
            parsed["metadata"]["processing_time_ms"] = int((time.time() - start_time) * 1000)
            
            return parsed
            
        except DeepSeekError as e:
            # Map DeepSeek errors to standard error format
            # We treat them as connection/timeout type errors for 503 mapping
            return create_error_response(
                error_type="connection", # Using 'connection' maps to 503 in backend
                error_message=str(e),
                retry_attempted=is_retry
            )
        except Exception as e:
            last_error = str(e)
            continue
    
    # All attempts failed
    return create_error_response(
        error_type="invalid_json" if "parse" in str(last_error).lower() else "schema_validation",
        error_message=str(last_error),
        raw_output=raw_output[:1000] if raw_output else None,
        retry_attempted=MAX_RETRIES > 0
    )


def main():
    """Main entry point with argument parsing."""
    parser = argparse.ArgumentParser(
        description="Analyze regulatory changes using LLM"
    )
    parser.add_argument(
        "--old", "-o",
        required=True,
        help="Path to old regulation text file"
    )
    parser.add_argument(
        "--new", "-n",
        required=True,
        help="Path to new regulation text file"
    )
    parser.add_argument(
        "--output",
        help="Optional output file path (default: outputs/analysis_TIMESTAMP.json)"
    )
    parser.add_argument(
        "--model", "-m",
        default=DEFAULT_MODEL,
        help=f"Ollama model to use (default: {DEFAULT_MODEL})"
    )
    
    args = parser.parse_args()
    
    # Read input files
    try:
        old_text = read_input_file(args.old)
        new_text = read_input_file(args.new)
    except (FileNotFoundError, ValueError) as e:
        error_result = create_error_response(
            error_type="input_error",
            error_message=str(e)
        )
        print(json.dumps(error_result, indent=2))
        sys.exit(1)
    
    print(f"Analyzing with model: {args.model}")
    print(f"Old text: {len(old_text)} characters")
    print(f"New text: {len(new_text)} characters")
    print("-" * 40)
    
    # Run analysis
    result = run_analysis(old_text, new_text, model=args.model)
    
    # Save to file
    saved_path = save_output(result, args.output)
    print(f"Saved to: {saved_path}")
    print("-" * 40)
    
    # Print to stdout
    print(json.dumps(result, indent=2))
    
    # Exit with error code if analysis failed
    if result.get("error"):
        sys.exit(1)


if __name__ == "__main__":
    main()
