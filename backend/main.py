"""OrderTogether API — Application entry-point."""

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from core.config import settings
from core.lifecycle import startup
from routers import auth, config, orders, services, users


@asynccontextmanager
async def lifespan(_app: FastAPI):
    """Run startup tasks, then yield until shutdown."""
    await startup()
    yield


app = FastAPI(title=settings.APP_NAME, lifespan=lifespan)

# ── Static files ─────────────────────────────────────────────────────────────
icons_dir = Path(__file__).parent / "static" / "icons"
if icons_dir.exists():
    app.mount("/api/icons", StaticFiles(directory=str(icons_dir)), name="icons")

# ── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ──────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(services.router)
app.include_router(orders.router)
app.include_router(config.router)


@app.get("/api/health")
async def health():
    """Health-check endpoint."""
    return {"status": "ok", "app": settings.APP_NAME}
