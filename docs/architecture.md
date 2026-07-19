# Architecture Overview — StadiumMind AI 🏗️

This document describes the architectural style, design patterns, directory layouts, and technology decisions chosen for **StadiumMind AI**.

---

## 1. Clean Architecture (Backend)

The FastAPI backend is structured following **Clean Architecture** patterns to enforce separation of concerns, decoupling the database, routes, and business rules.

```
┌────────────────────────────────────────────────────────┐
│                      FastAPI Routing                   │  <-- api/ (HTTP layer, main.py)
└───────────────────────────┬────────────────────────────┘
                            ▼
┌────────────────────────────────────────────────────────┐
│                   Domain Business Logic                │  <-- services/ (Internal workflows)
└───────────────────────────┬────────────────────────────┘
                            ▼
┌───────────────────────────┴────────────────────────────┐
│                    Data & Infrastructure               │  <-- db/ (SQLAlchemy Session, Alembic)
│   ┌────────────────────────────────────────────────.   │  <-- models/ (DB Schemas/ORM definitions)
│   │                      PostgreSQL                │   │
│   └────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────┘
```

### Architecture Directories
*   **`main.py`**: App entry point configuring CORS middlewares, registers standard Swagger metadata, and binds custom exception handlers.
*   **`api/`**: The HTTP boundary containing endpoint controllers and routers. Keeps routing logic light. Imports `services` to run actions.
*   **`services/`**: The core repository containing the actual business logic workflows. decoupled from HTTP headers and query params.
*   **`models/`**: Defines SQLAlchemy database tables mapping schemas to our Supabase database.
*   **`schemas/`**: Pydantic models validating data entry (Request inputs) and structure formatting (Response outputs).
*   **`db/`**: Handles connections, transactions, session pools (`db/session.py`), and Alembic database migration scripts.
*   **`ai/`**: GenAI wrapper layer containing models integrations and orchestrators. Kept separate so the LLM adapter code can be mocked during testing.
*   **`core/`**: Single-source-of-truth configuration management (`core/config.py`), exception hierarchy (`core/exceptions.py`), and structured logging (`core/logging.py`).
*   **`middleware/`**: App-wide interception logic, including mapping core exceptions to JSON HTTP responses (`middleware/errors.py`).

---

## 2. Frontend App Router Model

The Next.js frontend uses React Server Components (RSC) App Router, dividing concerns between views and configurations:

*   **`app/`**: Route segments, global layouts, styles, page views, and client context providers.
*   **`components/`**: Modular presentation components:
    *   `components/ui/`: Atomic, reusable layout blocks (scaffolded via shadcn/ui).
    *   `components/`: Compound site widgets like themes and toggles.
*   **`config/`**: Site configurations, environment defaults, navigation structures, and static metadata.
*   **`lib/`**: Unified utility clients, such as our class name merger `cn` (`lib/utils.ts`) or TanStack Query instance (`lib/query-client.ts`).
*   **`features/`**: Folder grouping larger page components, widgets, or workflows belonging to unique domains (e.g., Volunteer checklist, Crowd map).
*   **`hooks/`**: Custom reusable React hooks for client behavior.
*   **`services/`**: Integrates frontend queries/mutations with the backend API endpoints.

---

## 3. Technology Stack Selection

| Layer | Technology | Decision Justification |
| :--- | :--- | :--- |
| **Frontend Core** | Next.js 16 (App Router) | Optimizes performance via React Server Components (RSC) and built-in client-side routing. |
| **Styling** | Tailwind CSS v4 & shadcn/ui | Accelerated prototyping speed using an accessible atomic utility style framework. |
| **State & Forms** | TanStack Query & React Hook Form | Decoupled client-server caching and performance-tuned validation via Zod resolvers. |
| **Backend API** | FastAPI & Pydantic v2 | High-performance asynchronous execution loop, automatic OpenAPI/Swagger rendering, and schema validation. |
| **Database** | PostgreSQL & SQLAlchemy v2 | Robust transactional integrity (ACID) and modern ORM abstractions using async-capable engine bindings. |

---

## 4. Security Principles

1.  **Configuration Verification**: App launch is gated on env validation. Incomplete environment variables raise clear initialization errors.
2.  **No Secrets In Source**: Local secrets are configured inside `.env` files (excluded from repository commits via `.gitignore`).
3.  **Strict CORS Bounds**: Cross-origin requests are limited only to verified staging and production URLs loaded via environmental config.
4.  **Prepared Authentication**: Ready to mount Supabase Auth JWT checking middleware securely in future milestones.
