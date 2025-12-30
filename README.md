# RegLens - Regulatory Compliance Analysis Platform

RegLens is a demonstration platform that uses LLMs to analyze regulatory document changes and suggest compliance tasks.

## Prerequisites

Before starting, ensure you have the following installed on your system:

- **Python 3.9+**: [Download Python](https://www.python.org/downloads/)
- **Node.js 18+** (LTS recommended): [Download Node.js](https://nodejs.org/)
- **Ollama**: [Download Ollama](https://ollama.com/) (Required for local LLM inference)

---

## 🚀 Setup & Run Instructions

### 1. LLM Setup (Ollama)

RegLens uses a local LLM via Ollama. You must have Ollama running and the model pulled before using the analysis features.

1.  **Start Ollama** (if not already running in the tray/background):
    ```bash
    ollama serve
    ```
    *Keep this terminal open if it doesn't run in the background.*

2.  **Pull the required model**:
    Open a new terminal and run:
    ```bash
    ollama pull mistral
    ```
    *Note: You can check `llm_pipeline/config.py` if a different default model is configured.*

### 2. Backend Setup (Python)

The backend powers the API and connects to the LLM pipeline.

1.  **Create a virtual environment** (at the project root):
    ```bash
    # Windows
    python -m venv venv

    # macOS/Linux
    python3 -m venv venv
    ```

2.  **Activate the virtual environment**:
    ```bash
    # Windows (PowerShell)
    .\venv\Scripts\Activate

    # Windows (Command Prompt)
    venv\Scripts\activate

    # macOS/Linux
    source venv/bin/activate
    ```

3.  **Install Python dependencies**:
    ```bash
    pip install -r requirements.txt
    ```

4.  **Start the FastAPI server**:
    ```bash
    cd backend
    uvicorn main:app --reload --host 0.0.0.0 --port 8000
    ```
    The API will be available at `http://localhost:8000`.
    API Documentation: `http://localhost:8000/docs`

### 3. Frontend Setup (React)

The frontend provides the user interface for uploading documents and viewing analysis.

1.  **Navigate to the frontend directory** (open a new terminal):
    ```bash
    cd frontend
    ```

2.  **Install Node dependencies**:
    ```bash
    npm install
    ```

3.  **Start the development server**:
    ```bash
    npm run dev
    ```
    The application will launch at `http://localhost:5173` (or similar).

---

## 🧪 Running the LLM Pipeline Standalone

You can run the analysis script directly from the command line without the full UI.

1.  **Ensure your virtual environment is activated** (`source venv/bin/activate` or windows equivalent).

2.  **Navigate to the pipeline directory**:
    ```bash
    cd llm_pipeline
    ```

3.  **Run the analysis script**:
    ```bash
    # Example usage
    python analyze.py --old inputs/old_regulation.txt --new inputs/new_regulation.txt --output results.json
    ```
    *Make sure you have sample text files in `llm_pipeline/inputs/`.*
