"""Async SQLAlchemy engine and session factory."""

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from core.config import settings

engine = create_async_engine(
    settings.get_database_url,
    echo=settings.DEBUG,
    future=True,
)

async_session = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


def _add_auth_source_if_missing(sync_conn):
    """Add auth_source column to users table if missing (e.g. after adding LDAP)."""
    try:
        result = sync_conn.execute(text("SELECT 1 FROM pragma_table_info('users') WHERE name='auth_source'"))
        if result.scalar() is None:
            sync_conn.execute(text("ALTER TABLE users ADD COLUMN auth_source VARCHAR(20) NOT NULL DEFAULT 'local'"))
    except Exception:
        pass


async def init_db() -> None:
    """Create all tables (dev convenience — use Alembic in prod)."""
    from models.base import Base  # noqa: F811
    import models.user  # noqa: F401
    import models.order  # noqa: F401
    import models.delivery_service  # noqa: F401
    import models.invite  # noqa: F401
    import models.comment  # noqa: F401
    import models.notification  # noqa: F401
    import models.receipt  # noqa: F401

    import models.activity  # noqa: F401
    import models.poll  # noqa: F401

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        if "sqlite" in settings.get_database_url:
            await conn.run_sync(_add_auth_source_if_missing)
