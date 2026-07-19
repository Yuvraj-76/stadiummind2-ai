# Setup & Installation Guide — StadiumMind AI ⚙️

This document guides developers through setting up, configuring, running, and verifying the StadiumMind AI monorepo locally.

---

## 1. System Requirements

Ensure the following tools are installed on your workstation:
*   **Node.js**: v18.0.0 or higher (Tested on v24.13.0)
*   **Python**: v3.10 or higher (Tested on v3.11.0)
*   **Package Managers**: `npm` and `pip` (or `uv` for faster Python installs)
*   **Git**: For source control

---

## 2. Monorepo Initial Setup

Clone the repository and inspect the folder structure:
```bash
git clone https://github.com/stadiummind-ai/stadiummind-ai.git
cd stadiummind-ai
```

---

## 3. Backend Local Run

Follow these commands to configure the Python virtual environment and run the FastAPI server:

```bash
# 1. Enter backend folder
cd backend

# 2. Initialize a Python virtual environment
python -m venv .venv

# 3. Activate the virtual environment
# Windows (PowerShell):
.venv\Scripts\Activate.ps1
# Windows (cmd.exe):
.venv\Scripts\activate.bat
# macOS/Linux:
source .venv/bin/activate

# 4. Install dependency packages
pip install -r requirements.txt

# 5. Create local environment configuration from example
copy .env.example .env

# 6. Start the development server
uvicorn main:app --reload
```

Once started, the backend is available at:
*   **API Root**: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health) (Returns system health)
*   **Swagger Documentation**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
*   **Redoc API View**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

## 4. Frontend Local Run

Follow these commands to install modules and run Next.js:

```bash
# 1. Open a new terminal tab at the monorepo root, then enter frontend
cd frontend

# 2. Install dependency packages
npm install

# 3. Launch the development server
npm run dev
```

Once running, the Next.js landing page is available at:
*   **Frontend Site**: [http://localhost:3000](http://localhost:3000)

---

## 5. Running Code Quality Linters

Maintain code standards locally before submitting commits:

### Backend Checks
From the `backend/` directory:
```bash
# Run Black formatting check
black --check .

# Run Ruff linter
ruff check .

# Run Mypy static type checking
mypy .
```

### Frontend Checks
From the `frontend/` directory:
```bash
# Run ESLint validation
npm run lint

# Run TypeScript type check
npm run typecheck

# Run Prettier format check
npx prettier --check .
```
To auto-fix code format, you can run `npx prettier --write .`.
