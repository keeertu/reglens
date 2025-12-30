import sys
import os
import json
from pathlib import Path
from unittest.mock import patch, MagicMock

# Setup paths to allow imports from llm_pipeline
current_file = Path(__file__).resolve()
project_root = current_file.parent.parent
llm_pipeline_path = project_root / "llm_pipeline"

sys.path.insert(0, str(project_root))
sys.path.insert(0, str(llm_pipeline_path))

from llm_pipeline.analyze import run_analysis, read_input_file
# Import DeepSeekError from the module directly to match analyze.py's context
# assuming llm_pipeline is in sys.path
try:
    from deepseek_client import DeepSeekError
except ImportError:
    from llm_pipeline.deepseek_client import DeepSeekError

def test_deepseek_integration():
    print("Testing DeepSeek Integration...")
    
    # 1. Test PDF Routing
    print("\n[1] Testing PDF Text Extraction Routing...")
    # Mock extract_text_from_pdf inside analyze module directly
    with patch("llm_pipeline.analyze.extract_text_from_pdf", return_value="PDF CONTENT") as mock_ext:
        # Create a dummy pdf file
        dummy_pdf = Path("test.pdf")
        dummy_pdf.touch()
        try:
             content = read_input_file("test.pdf")
             if content == "PDF CONTENT":
                 print("PASS: PDF routed to extract_text_from_pdf")
             else:
                 print(f"FAIL: Expected 'PDF CONTENT', got '{content}'")
                 exit(1)
        finally:
            if dummy_pdf.exists():
                dummy_pdf.unlink()

    # 2. Test DeepSeek Client Integration (Mocked)
    print("\n[2] Testing DeepSeek Client Integration...")
    
    mock_response_text = json.dumps({
        "analysis_id": "test-id",
        "summary": "Test Summary",
        "overall_risk_level": "low",
        "overall_confidence": "high",
        "changes": [],
        "suggested_tasks": [],
        "uncertainty_flags": [],
        "metadata": {"model_used": "test"}
    })
    
    with patch("llm_pipeline.analyze.call_deepseek") as mock_call:
        mock_call.return_value = (mock_response_text, {"token_count": 10})
        
        result = run_analysis("old", "new")
        
        if result.get("summary") == "Test Summary":
            print("PASS: run_analysis returned valid schema from DeepSeek mock")
        else:
            print("FAIL: run_analysis result invalid")
            print(result)
            exit(1)

    # 3. Test DeepSeek Failure Handling
    print("\n[3] Testing DeepSeek Failure Handling...")
    with patch("llm_pipeline.analyze.call_deepseek") as mock_call:
        mock_call.side_effect = DeepSeekError("API Unavailable")
        
        result = run_analysis("old", "new")
        
        if result.get("error") and result.get("error_type") == "connection":
             print("PASS: DeepSeekError mapped to 'connection' error (503 safe)")
        else:
             print("FAIL: DeepSeekError not handled correctly")
             print(result)
             exit(1)

    print("\nALL TESTS PASSED")

if __name__ == "__main__":
    test_deepseek_integration()
