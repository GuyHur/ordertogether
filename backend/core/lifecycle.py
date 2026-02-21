"""Application lifecycle events (startup / shutdown)."""

from sqlalchemy import select

from core.database import async_session, init_db
from core.seed import SEED_SERVICES
from models.delivery_service import DeliveryService


async def startup() -> None:
    """Create tables and seed initial data."""
    await init_db()
    await _seed_services()


async def _seed_services() -> None:
    """Insert delivery services if the table is empty."""
    async with async_session() as session:
        result = await session.execute(select(DeliveryService))
        if result.scalars().first() is not None:
            return

        for svc in SEED_SERVICES:
            session.add(DeliveryService(**svc))
        await session.commit()
