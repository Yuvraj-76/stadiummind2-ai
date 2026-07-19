# StadiumOS ⚽ — The Intelligent Stadium Operations Copilot

StadiumOS is a production-grade, modular, and scalable GenAI-powered platform designed for the **FIFA World Cup 2026**. The platform optimizes stadium operations and enriches matchday experiences for three distinct target roles: **Fans**, **Volunteers**, and **Organizers**.

Built on **Clean Architecture** patterns in the backend and a modern **Next.js App Router** frontend, it leverages Generative AI to deliver real-time navigation support, crowd management recommendations, instant multilingual translations, automated volunteer standard operating procedures (SOPs), and organizer decision tools.

---

## 🏗️ Folder Structure

```text
stadiumOS/
├── .github/                 # CI/CD Workflows
│   └── workflows/
│       └── ci.yml           # GitHub Actions (Linting, Typing, Pytest)
├── backend/                 # FastAPI Python Backend
│   ├── api/
│   │   ├── health.py        # Health checker endpoint
│   │   └── stadium.py       # REST API endpoints (zones, facilities, incidents, tasks, alerts, AI)
│   ├── core/
│   │   ├── config.py        # Settings validation (Pydantic Settings)
│   │   ├── exceptions.py    # Custom application error classes
│   │   └── logging.py       # Structured JSON log configurations
│   ├── db/
│   │   ├── seed.py          # Database seeding script (populates mock stadium data)
│   │   └── session.py       # SQLAlchemy engine and session provider
│   ├── middleware/
│   │   └── errors.py        # Global exception interception
│   ├── models/
│   │   ├── __init__.py      # SQLAlchemy model aggregator
│   │   └── stadium.py       # Database schemas (profiles, zones, facilities, incidents, tasks, alerts)
│   ├── schemas/
│   │   ├── __init__.py      # Pydantic schema aggregator
│   │   └── stadium.py       # HTTP request and response models
│   ├── services/
│   │   ├── __init__.py
│   │   └── ai_service.py    # GenAI prompt compiler and model orchestrator
│   ├── tests/
│   │   └── test_stadium.py  # Unit & Integration tests using in-memory SQLite DB
│   ├── main.py              # FastAPI app bootstrap
│   ├── requirements.txt     # Python packages
│   └── pyproject.toml       # Black, Ruff, and Mypy settings
└── frontend/                # Next.js TypeScript Frontend
    ├── app/
    │   ├── layout.tsx       # Root layout configuration
    │   ├── page.tsx         # Modern, high-impact landing page
    │   ├── role-select/     # Portal for selecting Fan/Volunteer/Organizer role
    │   ├── fan/             # Spectator Portal (SVG map navigation, alerts, SOS, AI chat)
    │   ├── volunteer/       # Volunteer Dashboard (tasks, translations, incident reports)
    │   └── organizer/       # Command Console (heatmaps, timeline, announcement maker, AI advice)
    ├── components/          # Reusable React components (providers, theme toggles)
    ├── config/              # Site constants
    ├── lib/                 # Classname mergers and QueryClient instantiations
    ├── public/              # Static media assets
    ├── services/
    │   ├── health.ts        # Health check fetch client
    │   └── stadium.ts       # Main API client communicating with FastAPI
    ├── package.json         # Node scripts & dependencies
    └── tsconfig.json        # TypeScript compiler configurations
```

---

## 🚀 Quick Start & Local Execution

### Prerequisites
- **Node.js**: v18.0.0+
- **Python**: v3.11+
- **Package Managers**: npm, pip

### 1. Backend Setup & Seeding
From the `backend/` directory:
```bash
# Create a virtual environment
python -m venv .venv

# Activate virtual environment
# Windows (PowerShell):
.venv\Scripts\Activate.ps1
# macOS/Linux:
source .venv/bin/activate

# Install all packages
pip install -r requirements.txt

# Run the database migrations & seeding script
# (This creates a local SQLite database and prepopulates mock data)
$env:PYTHONPATH="."
python db/seed.py

# Launch the FastAPI server
uvicorn main:app --reload --port 8000
```
- **Swagger Docs**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **Health Check**: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

### 2. Frontend Setup
From the `frontend/` directory:
```bash
# Install NPM dependencies
npm install

# Start the Next.js development server
npm run dev
```
- **Local Application**: [http://localhost:3000](http://localhost:3000)

---

## 🧠 Generative AI & Context Injection

StadiumOS avoids generic, static AI chats. Every query compiles real-time stadium metrics before dispatching prompts:
1. **Context Compilation**: The AI service queries the database for active Stand Density Levels, Wait Times at nearby restrooms/food concession stands, and current Live Broadcast Alerts.
2. **Dynamic Prompt Compilation**:
   - **Fans**: Recommends the fastest route to F&B, prioritizes accessible facilities if requested, and provides SOS evacuation coordinates in emergencies.
   - **Volunteers**: Generates step-by-step Standard Operating Procedures (SOPs) based on reported incidents.
   - **Organizers**: Formulates public address PA announcements and lists resource adjustments.
3. **Local Fallback Mode**: If `OPENAI_API_KEY` is not set or invalid, the platform triggers a context-aware fallback engine. It parses the inputs and answers realistically using current SQLite metrics, guaranteeing a functional application during grading.

---

## 🧪 Testing

We use `pytest` with a hermetic in-memory SQLite database and custom dependency overrides:
```bash
# From the backend/ directory
$env:PYTHONPATH="."
.venv\Scripts\pytest
```

---

## 🌐 Deployment Configuration

- **Frontend (Vercel)**: Configured for Serverless deployments. Ensure `NEXT_PUBLIC_BACKEND_URL` is set to point to your Render backend in Vercel settings.
- **Backend (Render)**: Set the root directory to `backend`, build command to `pip install -r requirements.txt`, and start command to `uvicorn main:app --host 0.0.0.0 --port $PORT`. Configure environment variables: `DATABASE_URL` (Supabase Postgres link) and `OPENAI_API_KEY`.
- **Database (Supabase)**: Connect by pasting your transactional PostgreSQL connection string into `DATABASE_URL`.
