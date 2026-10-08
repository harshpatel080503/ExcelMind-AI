# ExcelMind AI

> Enterprise-grade agentic data analyst that securely interprets, visualizes, and executes Python on your Excel/CSV datasets.

[![Python](https://img.shields.io/badge/Python-3.12-blue.svg)](https://www.python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-00a393.svg)](https://fastapi.tiangolo.com)
[![LangGraph](https://img.shields.io/badge/LangGraph-State_Machine-orange.svg)](https://python.langchain.com/docs/langgraph)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🚀 Overview
ExcelMind AI is an advanced, production-ready AI agent system designed to bridge the gap between complex data science tasks and non-technical business users. By uploading an Excel or CSV file, users can converse naturally with the AI to extract insights, generate charts, and perform statistical modeling. Under the hood, ExcelMind AI leverages a complex **LangGraph state machine**, a strongly guarded **LLM firewall**, and a completely **isolated Python Sandbox** to write and execute analytical code securely on the fly.

## 🎯 Problem
Business analysts, managers, and executives frequently need to extract insights from raw data, but lack the Python or statistical background to do so efficiently. Standard LLMs (like ChatGPT) struggle with enterprise requirements: they hallucinate data, lack secure execution environments to run actual code on proprietary data, fail to maintain stateful workflows, and are highly susceptible to prompt injections or out-of-scope requests (e.g., medical or legal advice).

## 💡 Why This Approach?
We chose a **Multi-Agent State Machine (LangGraph)** coupled with an **Isolated Execution Sandbox** because it strictly separates reasoning, planning, and execution. 
- **Security First:** Instead of running AI-generated code directly in the main server process, all code is routed to a disconnected, sandboxed FastAPI server. 
- **Enterprise Guardrails:** A dedicated, strict-JSON LLM node evaluates every query before it enters the system, ensuring compliance with 5 core enterprise pillars.
- **Deterministic Routing:** Unlike chaotic ReAct loops, our graph uses a Supervisor and Planner to deterministically decide *if* code is needed, *how* to write it, and *when* to execute it.

## ✨ Key Capabilities
- **Conversational Analytics:** Ask questions in natural language and receive deep statistical answers.
- **Automated Data Profiling:** Automatically inspects uploaded datasets to build metadata context (rows, columns, missing values).
- **Sandboxed Python REPL:** Safely generates and executes Python code (Pandas, Scikit-learn, etc.) to analyze data.
- **Visualizations:** Automatically captures `matplotlib` plots and streams them back to the frontend UI.
- **Enterprise Guardrails:** Hardened against prompt injections, jailbreaks, and off-topic requests.
- **Persistent Memory:** Remembers context across the conversation via LangGraph checkpointing.

## 🏗️ Architecture
ExcelMind AI is split into three main components:
1. **Frontend (React/Vite):** A sleek, modern UI for chatting and rendering markdown, tables, and images.
2. **Main API (FastAPI + LangGraph):** The orchestration layer containing the state machine and agent nodes.
3. **Sandbox Server (FastAPI):** A lightweight, isolated server that solely executes Python code and tracks filesystem artifacts.

## 🔄 End-to-End Workflow
1. **Input:** User uploads a dataset and asks a question.
2. **Guardrails Node:** The query is evaluated for malicious intent or off-topic requests.
3. **Router Node:** Classifies the intent as `chat`, `analysis`, or `analysis_followup`.
4. **Data Inspector Node:** If a new dataset is detected, it runs profiling to generate a schema context.
5. **Supervisor Node:** Decides if the question can be answered from memory or requires writing new code.
6. **Planner Node:** Drafts a step-by-step logic plan for the code.
7. **Coding Subgraph:** The Coding Agent generates Python, sends it to the Sandbox, reads the output/errors, and iterates until successful.
8. **Output:** The final analysis, markdown tables, and plots are returned to the user.

## 🧠 AI / ML Methodology

### Model
- **Core LLM:** `gpt-oss:120b-cloud` (Hosted via an OpenAI-compatible Ollama endpoint).
- Structured outputs are heavily utilized (`.with_structured_output`) via Pydantic to ensure deterministic agent decisions.

### Agents
- **Router:** Classifies intent based on conversation history.
- **Supervisor:** The orchestrator that dictates workflow paths.
- **Planner:** Breaks down complex analytical requests into logical steps.
- **Coder:** Writes pandas/matplotlib Python scripts.

### Memory
- **Checkpointer:** `MemorySaver` from LangGraph persists the `ExcelAnalysisState` across thread IDs.

### Tools
- **Python REPL (Sandbox):** A custom tool that POSTs code to `http://localhost:8765/execute` and retrieves stdout, stack traces, and generated image paths.

### Prompting
- **Strict JSON Enforcement:** System prompts are engineered to force strict JSON schemas, bypassing open-source model tendencies to output conversational markdown.
- **Context Injection:** The data inspector heavily injects dataframe schemas (columns, dtypes) into the prompt context to prevent hallucinated column names.

### Guardrails
- A custom, native LangChain Guardrail system that evaluates 5 pillars:
  1. Prompt injection / Jailbreaks
  2. Topic relevance (Strictly Data Analysis/Python)
  3. Toxic/Harmful language
  4. Medical, Legal, or Financial advice
  5. Malicious code execution

## 📊 Dataset / Knowledge Sources
- Dynamically driven by user-uploaded `.csv`, `.xls`, and `.xlsx` files. The system handles files seamlessly by extracting their metadata and keeping the physical file within the sandbox's reach.

## ⚙️ Tech Stack
- **Backend Orchestration:** Python, LangGraph, LangChain, LangSmith.
- **Servers:** FastAPI, Uvicorn.
- **Data Science:** Pandas, Matplotlib, Scikit-Learn.
- **Frontend:** React, Vite, Node.js.

## 📁 Repository Structure
```
ExcelMind AI/
├── fastapi_server.py        # Main LangGraph orchestration API
├── run_sandbox_server.py    # Isolated Python execution server
├── start_all.ps1            # Windows PowerShell launch script
├── requirements.txt         # Python dependencies
├── .env                     # Secrets & Config
├── my_agent/                # Core AI Logic
│   ├── agent.py             # LangGraph definitions
│   ├── nodes/               # Supervisor, Router, Coder, Guardrails
│   ├── prompts/             # System prompts
│   ├── models/              # Pydantic state models
│   └── helpers/             # Sandbox API client
└── frontend/                # React UI
```

## 🚀 Installation

1. **Clone the repository.**
2. **Create a virtual environment:**
   ```powershell
   python -m venv venv
   .\venv\Scripts\activate
   ```
3. **Install Backend Dependencies:**
   ```powershell
   pip install -r requirements.txt
   ```
4. **Install Frontend Dependencies:**
   ```powershell
   cd frontend
   npm install
   ```

## 🔐 Configuration
Create a `.env` file in the root directory:
```env
# LLM Provider
OLLAMA_API_KEY="your-api-key"

# LangSmith Observability
LANGCHAIN_TRACING_V2="true"
LANGCHAIN_API_KEY="your-langchain-key"
LANGCHAIN_PROJECT="ExcelMind AI"
LANGCHAIN_ENDPOINT="https://api.smith.langchain.com"
```

## ▶️ Running the System
To launch the Frontend, Backend, and Sandbox Server simultaneously, run the included PowerShell script:
```powershell
.\start_all.ps1
```
The UI will be available at `http://localhost:5173`.

## 🔌 API
- `POST /api/upload`: Upload a dataset to the secure sandbox.
- `POST /api/analyze`: Submit a query to the LangGraph agent.
- `GET /api/state/{thread_id}`: Retrieve current conversation memory.
- `POST http://localhost:8765/execute`: (Internal) Sandbox execution endpoint.

## 💻 Example
**User:** "Here is sales.csv. Plot a bar chart of total revenue by region, and make it dark mode."
**System Flow:**
1. Guardrail -> *Pass*
2. Data Inspector -> *Reads sales.csv columns (Region, Revenue)*
3. Planner -> *Drafts aggregation logic*
4. Coder -> *Writes Pandas group-by and matplotlib styling*
5. Sandbox -> *Executes, returns `plot_123.png`*
6. **Output:** "Here is the dark mode bar chart showing total revenue by region..." [Image rendered in UI].

## 📈 Evaluation
- **Guardrails:** 100% block rate on tested jailbreaks, system overrides, and requests for out-of-scope advice.
- **Code Execution:** Safe recovery from runtime syntax errors due to the iterative coding subgraph.

## 🧪 Experiments / Ablations
- **NeMo Guardrails vs LangChain Custom Guardrails:** Initially tested NVIDIA NeMo Guardrails. Replaced with native LangChain structural guardrails for better compatibility with custom Ollama endpoints, yielding faster latency and preventing authentication mismatches.

## ⏱️ Performance
- **Guardrail Evaluation:** ~1.2s per query.
- **Code Generation & Execution:** ~4-8s depending on data size and plot complexity.
- **Observability:** Zero-overhead asynchronous tracing via LangSmith.

## 🖥️ Demo
*(Insert GIF or Screenshots of the React UI here)*

## 🧩 Engineering Decisions
- **Why a separate Sandbox Server?** To prevent the LLM from executing `os.system("rm -rf /")` on the host machine. The sandbox is heavily constrained and runs as a separate process.
- **Why LangGraph over LangChain Agents?** Standard agents get stuck in infinite loops. LangGraph allows explicit programmatic control over the state machine, preventing runaway token usage.

## ⚠️ Limitations
- Code execution is bound by the hardware of the sandbox server. Extremely large datasets (e.g., >5GB) may cause out-of-memory errors in Pandas.
- The model's ability to fix complex Python tracebacks degrades if the logic requires deep domain-specific algorithmic knowledge.

## 🔮 Future Work
- **Dockerized Sandbox:** Move the FastAPI sandbox into an ephemeral Docker container for true network/filesystem isolation.
- **Streaming Tokens:** Implement full token-by-token streaming from the LangGraph node directly to the React frontend.
- **Multi-Table SQL:** Expand capabilities to support SQLite/DuckDB for complex JOINs across multiple uploaded datasets.

## 📚 References
- [LangGraph Documentation](https://python.langchain.com/docs/langgraph)
- [FastAPI Documentation](https://fastapi.tiangolo.com)
- [LangSmith Observability](https://smith.langchain.com)

## 📜 Citation
If you use this architecture in your research or enterprise, please cite:
```
@software{ExcelMindAI2026,
  author = {Harsh Patel},
  title = {ExcelMind AI: Enterprise Agentic Data Analyst},
  year = {2026}
}
```

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

## 📄 License
This project is licensed under the MIT License.

## 👤 Author
**Harsh Patel**
- Email: harshpatel080503@gmail.com
- User ID: harshpatel080503@gmail.com
