
import sys
from pathlib import Path

# Add llm_pipeline to sys.path explicitly to allow imports
PIPELINE_PATH = Path(__file__).parent.parent / "llm_pipeline"
if str(PIPELINE_PATH) not in sys.path:
    sys.path.append(str(PIPELINE_PATH))

import os
import uvicorn
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import shutil
import tempfile
import logging

# Import from the LLM pipeline
try:
    from analyze import run_analysis, read_input_file
except ImportError as e:
    logging.error(f"Failed to import llm_pipeline: {e}")
    # We continue so at least the server starts, but /analyze will fail
    run_analysis = None
    read_input_file = None

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("reglens_backend")

app = FastAPI(title="RegLens API", version="1.0.0")

# ============================================================
# CORS CONFIGURATION
# ============================================================
origins = [
    "http://localhost:5173",  # Vite Frontend
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# DATA MODELS
# ============================================================
class AnalysisRequest(BaseModel):
    old_text: str
    new_text: str

# ============================================================
# ENDPOINTS
# ============================================================

@app.get("/health")
def health_check():
    """Health check endpoint to verify backend is running."""
    return {"status": "ok", "service": "reglens-backend"}

@app.post("/analyze")
async def analyze_documents(
    old_file: UploadFile = File(...),
    new_file: UploadFile = File(...)
):
    """
    Endpoint to analyze two regulation files.
    Accepts multipart/form-data upload.
    """
    if not run_analysis:
        raise HTTPException(status_code=500, detail="Backend configuration error: LLM pipeline not found")

    # Create a temporary directory to store uploaded files
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)
        
        # Save uploaded files
        old_path = temp_path / "old.txt"
        new_path = temp_path / "new.txt"
        
        try:
            with old_path.open("wb") as buffer:
                shutil.copyfileobj(old_file.file, buffer)
            
            with new_path.open("wb") as buffer:
                shutil.copyfileobj(new_file.file, buffer)
                
            # Read contents using the pipeline's safe reader
            old_text = read_input_file(str(old_path))
            new_text = read_input_file(str(new_path))
            
            logger.info(f"Analyzing documents: {len(old_text)} chars vs {len(new_text)} chars")
            
            # Run the LLM analysis
            result = run_analysis(old_text, new_text)
            
            # Check for errors in the result
            if result.get("error"):
                 # Determine status code based on error type
                 error_type = result.get("error", {}).get("type")
                 status_code = 503 if error_type in ["connection", "timeout"] else 400
                 return JSONResponse(status_code=status_code, content=result)

            return result

        except Exception as e:
            logger.error(f"Analysis failed: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))
        finally:
            # Files are cleaned up by TemporaryDirectory, but explicit close is good practice
            await old_file.close()
            await new_file.close()

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
