# Contributing Guide — StadiumMind AI 🤝

Thank you for contributing to StadiumMind AI! To maintain a production-grade workspace, all engineers must follow the guidelines outlined below.

---

## 1. Monorepo Workflow

Our monorepo isolates the UI concerns in `frontend/` and service logic in `backend/`. 

*   **Separate commits**: Keep backend structural edits and frontend component edits in separate commits if possible.
*   **Pull Requests**: Target all PRs to the `dev` or `main` branches. Branch naming convention:
    *   `feat/your-feature-name` (New features)
    *   `fix/bug-fix-name` (Bug fixes)
    *   `docs/documentation-update` (Docs only)
    *   `ci/pipeline-changes` (CI workflow edits)

---

## 2. Code Quality Rules

We enforce automated static checks inside our CI/CD pipelines:

### Python (Backend) Conventions
*   **Formatting**: Handled by **Black**. Max line length is `88` characters.
*   **Linting**: Handled by **Ruff** (imports organized, dead code flagged).
*   **Type Safety**: Every function signature *must* specify type annotations. Enforced by **Mypy** under `strict` configuration.
*   **Naming Conventions**:
    *   Classes: `PascalCase` (e.g., `UserService`)
    *   Functions & Variables: `snake_case` (e.g., `get_user_by_id`)
    *   Constants: `UPPER_SNAKE_CASE` (e.g., `JWT_ALGORITHM`)

### TypeScript (Frontend) Conventions
*   **Formatting**: Handled by **Prettier**. We enforce semicolon endings, double quotes, and sorted Tailwind CSS classes.
*   **Linting**: Checked via **ESLint** extending Next.js core web vitals and TypeScript strict rules.
*   **Type Safety**: Never use `any`. Always declare exact interface types or types mapped in `types/`.
*   **React Rules**:
    *   Use React Server Components (RSC) by default.
    *   Only add the `"use client";` boundary at the very top of components requiring browser events, React state (`useState`/`useEffect`), or hooks (e.g., theme toggle, form state).

---

## 3. Pull Request Checklist

Before submitting a pull request, run these validation steps:
1.  **Verify Backend Code quality**:
    *   Run `black --check .`
    *   Run `ruff check .`
    *   Run `mypy .`
2.  **Verify Frontend Code quality**:
    *   Run `npx prettier --check .`
    *   Run `npm run lint`
    *   Run `npm run typecheck`
3.  **Confirm Build Status**: Ensure both frontend and backend build locally without warning output.
