"""
PDF processing utilities using PyMuPDF (fitz).
Extracts clean text from PDF files for analysis.
"""

import logging
import re
try:
    import fitz  # PyMuPDF
except ImportError:
    fitz = None

logger = logging.getLogger(__name__)

def extract_text_from_pdf(filepath: str) -> str:
    """
    Extract text content from a PDF file.
    
    Args:
        filepath: Path to the PDF file
        
    Returns:
        Extracted text string
        
    Raises:
        ImportError: If PyMuPDF is not installed
        ValueError: If file is not a valid PDF or empty
        Exception: For other errors
    """
    if fitz is None:
        raise ImportError(
            "PyMuPDF (fitz) is not installed. "
            "Install it with: pip install pymupdf"
        )
        
    try:
        doc = fitz.open(filepath)
        text_content = []
        
        for page_num, page in enumerate(doc):
            # Extract text
            text = page.get_text()
            
            # Simple cleaning: remove header/footer noise often found at top/bottom
            # This is heuristic and minimal to avoid losing data
            lines = text.split('\n')
            cleaned_lines = []
            for line in lines:
                # remove mostly numeric lines (page numbers)
                if re.match(r'^\s*\d+\s*$', line):
                    continue
                # remove very short lines that might be artifacts? 
                # strictly keeping safe for now, just page numbers
                cleaned_lines.append(line)
            
            page_text = '\n'.join(cleaned_lines)
            text_content.append(page_text)
            
        doc.close()
        
        full_text = "\n\n".join(text_content)
        
        if not full_text.strip():
            raise ValueError("PDF file appears to be empty or contains no extractable text (scanned?)")
            
        return full_text
        
    except Exception as e:
        logger.error(f"Failed to extract PDF: {e}")
        raise e
