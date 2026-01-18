# RegLens

**AI-assisted regulatory change analysis with human-reviewed compliance workflows.**

RegLens is a high-performance regulatory compliance platform designed to bridge the gap between deterministic document analysis and AI-driven insights. It empowers compliance teams to detect, explain, and act upon regulatory changes with a "Human-in-the-Loop" philosophy, ensuring auditability and stability at every step.

RegLens is designed for compliance teams, legal analysts, and regulated startups that need explainable regulatory change detection without sacrificing audit integrity.


---

## 🚀 Key Features

- **Precision Comparison**: Bit-for-bit and section-aware comparison of old vs. new regulations (PDF/TXT).
- **Intelligent Explainability**: LLM-assisted summaries that transform complex legal diffs into actionable insights.
- **Batched Processing**: Sequential LLM execution with anti-burst delays to ensure stability and bypass provider rate limits.
- **Human-in-the-Loop (HITL)**: Mandatory review workflow for all AI-generated compliance tasks.
- **Audit-Ready Export**: One-click PDF report generation containing detected changes, explanations, and review metadata.
- **Enterprise Handling**: Built-in support for documents up to 200MB with memory-safe stream processing.

---

## 🏗️ High-Level Architecture

```text
[ User Interface ] <---- (Fetch Audit Reports)
      |
      V
[ React Frontend ] <---- (Manage Tasks & Approval)
      |
      V
[ FastAPI Backend ] ----> [ Change Extraction Engine ]
      |                         |
      |                         V
      |               [ Section Aligner & Differ ]
      |                         |
      V                         V
[ Batched LLM Analysis ] <--- [ Compressed Diffs ]
      |
      V
[ Compliance Task Store ] ----> [ PDF Audit Export ]
```

---

## 🛠️ Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, shadcn/ui.
- **Backend**: FastAPI (Python 3.9+).
- **LLM Engine**: OpenRouter (GPT-4o/DeepSeek models) with custom batching logic.
- **Core Libraries**: PyMuPDF (Extraction), FPDF (Export), Difflib (Differing).
- **Stability**: Async Concurrency Controls & Watchdog state management.

---

## 📐 Design Decisions

- **Sequential Batching**: Rather than sending full documents, we process small clusters of changes sequentially. This minimizes token usage and avoids API rate-limit "bursting".
- **HITL Enforcement**: AI never creates a "Final" task. All generation leads to a *Pending Review* state, ensuring zero-hallucination compliance.
- **State Isolation**: Task management is architecturally decoupled from the analysis pipeline, allowing for granular audit trails and reliable exports.
- **Concurrency Caps**: A hard semaphore cap on analysis requests ensures the host server remains responsive even under heavy load.

---

## ⚡ Local Setup

### 1. Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: .\venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## 🛡️ Security & Stability

- **Resource Protection**: Enforced 200MB file limits and async semaphores to prevent DoS.
- **Data Integrity**: Automated `try...finally` cleanup of all temporary processing files.
- **Isolation**: Filename sanitization and Path Traversal protection via UUID-based ephemeral storage.
- **Sanitized Errors**: Generic error responses to external clients to prevent internal stack trace leakage.

---

## 🏆 Hackathon Context

- **Event**: Built during **HackXios 2k25** (36-hour sprint).
- **Focus**: Real-world usability in highly regulated sectors (Finance, Healthcare, Law).
- **Submission**: Full source code + technical documentation + demonstration video.

---

## 👥 Team

- Keerat Khanuja
- Naman Lalwani
- Neelanchal Agarkar

---

## 🔮 Future Work

- **Granular Customization**: Allow users to tune the LLM batch size and delay parameters directly from the UI.
- **Enterprise Storage**: Transition from in-memory `TASK_STORE` to a persistent database (PostgreSQL) for long-term audit trails.
- **Multi-Document Analysis**: Enable cross-referencing between multiple regulatory bodies to detect overlapping compliance requirements.

---

## 📝 Closing Note

RegLens was built to solve the "trust gap" in AI automation. By combining deterministic diffing with batched LLM analysis and mandatory human review, we provide a tool that is as stable as it is smart. The architecture is designed for scale, ready for enterprise integration and advanced regulatory intelligence.
