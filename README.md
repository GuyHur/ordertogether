# OrderTogether

OrderTogether is a web application for coordinating group food delivery orders within a shared building or office. Users create a group order for a specific delivery service (Wolt, Tenbis, Mishloha, etc.), and others can join before a deadline. The goal is to reduce individual delivery fees by consolidating orders.

## Features

- **Group order management** -- create, join, leave, lock, and track delivery orders through their full lifecycle (open, locked, ordered, delivered, cancelled).
- **Multi-service support** -- built-in support for Wolt, Tenbis, and Mishloha, with extensible service definitions stored in the database.
- **QR code generation** -- for Wolt orders, a scannable QR code linking to the group order is generated locally on the client. No data is sent to external services.
- **Theme system** -- six visual themes (Midnight, Dark, Light, Sunset, Ocean, Forest) with full CSS variable architecture. Theme preference is persisted in local storage.
- **Authentication** -- JWT-based registration and login with bcrypt password hashing and automatic token refresh.
- **Real-time countdown** -- live deadline timers on the order board with visual urgency indicators.

## Tech Stack

| Layer    | Technology                                                                 |
|----------|---------------------------------------------------------------------------|
| Backend  | Python 3.12+, FastAPI, SQLAlchemy (async), aiosqlite, Pydantic v2        |
| Frontend | React 18, Vite, React Router, qrcode.react, Lucide icons                |
| Auth     | JWT (python-jose), bcrypt                                                |
| Database | SQLite (local development); async via aiosqlite                          |
| Styling  | Vanilla CSS with a custom design-token system (CSS custom properties)    |

   ```bash
   cd backend && uv sync && uv run uvicorn main:app --reload
   ```
   API: http://127.0.0.1:8000 (docs at /docs).

2. **Frontend** (in another terminal):
   ```bash
   cd frontend && npm install && npm run dev
   ```
   App: http://localhost:5173 (proxies `/api` to the backend).

## Running Locally

### Prerequisites

- Python 3.12 or later
- Node.js 18 or later
- [uv](https://docs.astral.sh/uv/) (Python package manager)

### Backend

```bash
cd backend
uv sync
uv run uvicorn main:app --reload
```

The API server starts at `http://127.0.0.1:8000`. Interactive documentation is available at `/docs`.

On first startup the database is created automatically and seeded with the default delivery services.

### Frontend

In a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

The development server starts at `http://localhost:5173`. API requests under `/api` are proxied to the backend.

## Environment Variables

The backend reads from `backend/.env`. Default values are provided for local development:

| Variable              | Default                          | Description                       |
|-----------------------|----------------------------------|-----------------------------------|
| `DATABASE_URL`        | `sqlite+aiosqlite:///./ordertogether.db` | Async SQLAlchemy connection string |
| `JWT_SECRET`          | `change-me-in-production`        | Secret key for signing JWT tokens |
| `JWT_ALGORITHM`       | `HS256`                          | JWT signing algorithm             |
| `JWT_EXPIRE_MINUTES`  | `60`                             | Access token lifetime in minutes  |

## License

This project is not currently published under an open-source license.
=======
## LDAP / Windows domain login

You can sync login with your Windows domain (Active Directory) so users sign in with their AD credentials.

1. In the backend, set environment variables (or add them to `backend/.env`):

   - `LDAP_ENABLED=true`
   - `LDAP_URL` — e.g. `ldap://your-dc.company.com` or `ldaps://...`
   - `LDAP_BASE_DN` — e.g. `DC=company,DC=com`
   - `LDAP_BIND_DN` — service account DN for searching (optional if anonymous bind is allowed), e.g. `CN=svc-ldap,OU=Service Accounts,DC=company,DC=com`
   - `LDAP_BIND_PASSWORD` — password for the service account
   - `LDAP_USER_SEARCH_ATTRIBUTE` — attribute to match the login value, usually `userPrincipalName` (email) or `sAMAccountName` (Windows username)
   - `LDAP_USER_SEARCH_ATTRIBUTE_ALT` — optional second attribute so users can log in with either email or username (e.g. `sAMAccountName` if primary is `userPrincipalName`)
   - `LDAP_USER_SEARCH_FILTER` — optional, e.g. `(objectClass=user)` or restrict to an OU

2. Install dependencies: `cd backend && uv sync` (adds `ldap3`).

3. On first LDAP login, a user record is created or updated in the app (display name from AD). Existing local users can also sign in via LDAP; their record is then linked to LDAP.

The same login form is used: users enter email (or Windows username if you set `LDAP_USER_SEARCH_ATTRIBUTE`/alt to support it) and password. No frontend changes required.
