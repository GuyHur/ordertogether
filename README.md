# OrderTogether

## Tech Stack

- **Backend**: [FastAPI](https://fastapi.tiangolo.com/) (Python)
- **Frontend**: JavaScript-based framework (e.g. React, Vue, Svelte, Next.js)

Backend and frontend are separate applications; the frontend consumes the FastAPI API over HTTP. Project guidelines are also defined in `.cursor/rules/` for consistent development.

## Run locally

1. **Backend** (uses [uv](https://docs.astral.sh/uv/); from project root):
   ```bash
   cd backend && uv sync && uv run uvicorn main:app --reload
   ```
   API: http://127.0.0.1:8000 (docs at /docs).

2. **Frontend** (in another terminal):
   ```bash
   cd frontend && npm install && npm run dev
   ```
   App: http://localhost:5173 (proxies `/api` to the backend).
