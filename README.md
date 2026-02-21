# OrderTogether

OrderTogether is a web application for coordinating group food delivery orders within a shared building or office. Users create a group order for a specific delivery service (Wolt, Tenbis, Mishloha, etc.), and others can join before a deadline. The goal is to reduce individual delivery fees by consolidating orders.

## Features

- **Group order management** -- create, join, leave, lock, and track delivery orders through their full lifecycle (open, locked, ordered, delivered, cancelled).
- **In-App Chat & Notifications** -- Every order has a dedicated chat room. You receive real-time notifications when users join, leave, comment, upload receipts, or when the order status changes.
- **Receipt Uploads** -- The order creator can upload a digital receipt for everyone in the group to view and download, ensuring transparent fee splits.
- **Admin & Superuser Dashboard** -- Admins can manage available buildings, food tags, and delivery services directly via the UI. Superusers can promote or demote Admins from an internal user management dashboard.
- **Multi-service support** -- built-in support for Wolt, Tenbis, and Mishloha, with extensible service definitions stored in the database.
- **QR code generation** -- for Wolt orders, a scannable QR code linking to the group order is generated locally on the client. No data is sent to external services.
- **Theme system** -- six visual themes (Midnight, Dark, Light, Sunset, Ocean, Forest) with full CSS variable architecture. Theme preference is persisted in local storage.
- **Authentication** -- JWT-based registration and login with bcrypt password hashing and automatic token refresh. Optionally supports Windows Active Directory (LDAP) logins.
- **Real-time countdown** -- live deadline timers on the order board with visual urgency indicators.

## Tech Stack

| Layer    | Technology                                                                 |
|----------|---------------------------------------------------------------------------|
| Backend  | Python 3.12+, FastAPI, SQLAlchemy (async), aiosqlite, asyncpg, Pydantic v2|
| Frontend | React 18, Vite, React Router, qrcode.react, Lucide icons                |
| Auth     | JWT (python-jose), bcrypt, ldap3                                         |
| Database | SQLite (default via `data/` dir) or PostgreSQL (optional via `.env`)     |
| Docker   | Multi-stage containerization with Docker Compose and Nginx               |

---

## Running inside Docker (Recommended)

The easiest way to run the application is via Docker Compose. It automatically spins up a robust PostgreSQL database, the Backend API, and the compiled Nginx Frontend.

1. Create a `backend/.env` file with your preferred configurations. For a quick start:
   ```env
   # backend/.env
   POSTGRES_USER="db_admin"
   POSTGRES_PASSWORD="secure_password"
   POSTGRES_DB="ordertogether"
   SUPERUSER_USERNAME="admin"
   SECRET_KEY="production-secret-here"
   ```

2. Run the deployment:
   ```bash
   docker-compose up -d --build
   ```

3. Access the application:
   - Frontend React App: `http://localhost:80`
   - Backend API Docs: `http://localhost:8000/docs`

---

## Running Locally (Development)

### Prerequisites
- Python 3.11+
- Node.js 18+
- [uv](https://docs.astral.sh/uv/) (Python package manager)

### Backend

```bash
cd backend
uv sync
uv run uvicorn main:app --reload
```
The API server starts at `http://127.0.0.1:8000`. On first startup, a local active SQLite database will be created inside the `backend/data/` folder, and it will be seeded with default services.

### Frontend

In a separate terminal:
```bash
cd frontend
npm install
npm run dev
```
The development server starts at `http://localhost:5173`, and natively proxies API requests to the backend server.

---

## Extended Configurations

The backend reads environment variables from `backend/.env`.

### 1. Database (SQLite or PostgreSQL)

By default, the application runs on SQLite in the `./data` directory. To seamlessly switch to a production-ready PostgreSQL instance:

| Variable              | Example / Default                | Description                                   |
|-----------------------|----------------------------------|-----------------------------------------------|
| `POSTGRES_HOST`       | `127.0.0.1`                       | Triggers Postgres mode instead of SQLite.     |
| `POSTGRES_PORT`       | `5432`                           | Required if `POSTGRES_HOST` is set.           |
| `POSTGRES_USER`       | `admin`                          | Postgres Username                             |
| `POSTGRES_PASSWORD`   | `password123`                    | Postgres Password                             |
| `POSTGRES_DB`         | `ordertogether`                  | Target logical Database Name                  |
| `DATABASE_URL`        | (overrides everything)           | A raw, full `postgresql://` URI string.       |

### 2. Superusers & Admins

To initialize your first administrator without needing direct database access, configure a Superuser. A Superuser can instantly elevate any standard user account to an Admin via the in-app Admin Dashboard.

- **`SUPERUSER_USERNAME`**: Give a specific local or LDAP user permanent Superuser privileges when they sign in (e.g. `SUPERUSER_USERNAME="my_admin_handle"`).
- **`LDAP_SUPERUSER_GROUP`**: If LDAP is active, any user whose Active Directory `memberOf` traits partially matches this DN (e.g. `CN=IT-Admins`) will automatically be promoted to a Superuser.

### 3. LDAP / Windows Domain Login

You can sync login with your Windows domain (Active Directory) so users sign in with their AD credentials. Local logins seamlessly continue to function side-by-side.

- `LDAP_ENABLED=true`
- `LDAP_URL` — e.g. `ldap://your-dc.company.com` or `ldaps://...`
- `LDAP_BASE_DN` — e.g. `DC=company,DC=com`
- `LDAP_BIND_DN` — service account DN for searching (optional if anonymous bind is allowed), e.g. `CN=svc-ldap,OU=Service Accounts,DC=company,DC=com`
- `LDAP_BIND_PASSWORD` — password for the service account
- `LDAP_USER_SEARCH_ATTRIBUTE` — attribute to match the login value, usually `userPrincipalName` (email) or `sAMAccountName` (Windows username)
- `LDAP_USER_SEARCH_ATTRIBUTE_ALT` — optional second attribute so users can log in with either email or username (e.g. `sAMAccountName` if primary is `userPrincipalName`)
- `LDAP_USER_SEARCH_FILTER` — optional, e.g. `(objectClass=user)` or restrict to an OU
