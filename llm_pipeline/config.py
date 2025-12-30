"""
Configuration constants for the LLM analysis pipeline.
All configurable values are centralized here.
"""

# Ollama server configuration
OLLAMA_BASE_URL = "http://localhost:11434"
OLLAMA_GENERATE_ENDPOINT = f"{OLLAMA_BASE_URL}/api/generate"

# Default model - can be overridden via command line
# Use mistral:latest for local testing (matches locally available model)
DEFAULT_MODEL = "mistral:latest"

# Request settings
REQUEST_TIMEOUT_SECONDS = 60

# Token/character limits for input validation
MAX_INPUT_CHARACTERS = 8000  # Approximate limit per input file
MAX_COMBINED_CHARACTERS = 15000  # Combined old + new text limit

# Output directory for saving results
OUTPUT_DIRECTORY = "outputs"

# Retry settings
MAX_RETRIES = 1  # Number of retries on failure
