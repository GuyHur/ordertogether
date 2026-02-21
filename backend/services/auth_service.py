"""Authentication business logic."""

import random

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import settings
from core.security import (
    LDAP_PASSWORD_SENTINEL,
    create_access_token,
    create_refresh_token,
    hash_password,
    verify_password,
)
from models.user import User
from services.ldap_service import authenticate_ldap

# Palette of pleasant avatar colours
AVATAR_COLORS = [
    "#63b3ed", "#68d391", "#f6ad55", "#fc8181", "#b794f4",
    "#f687b3", "#4fd1c5", "#ecc94b", "#9f7aea", "#ed8936",
]


async def register_user(
    db: AsyncSession,
    email: str,
    password: str,
    display_name: str,
    building: str | None = None,
) -> User:
    """Create a new user account."""
    # Check if email already exists
    result = await db.execute(select(User).where(User.email == email))
    if result.scalar_one_or_none() is not None:
        raise ValueError("Email already registered")

    user = User(
        email=email,
        display_name=display_name,
        password_hash=hash_password(password),
        building=building,
        avatar_color=random.choice(AVATAR_COLORS),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def get_or_sync_ldap_user(
    db: AsyncSession,
    email: str,
    display_name: str,
) -> User:
    """Get existing user by email or create one for LDAP (auth_source=ldap, placeholder password)."""
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if user is not None:
        if user.auth_source != "ldap":
            user.auth_source = "ldap"
            user.password_hash = LDAP_PASSWORD_SENTINEL
            user.display_name = display_name
            await db.commit()
            await db.refresh(user)
        return user
    user = User(
        email=email,
        display_name=display_name,
        password_hash=LDAP_PASSWORD_SENTINEL,
        auth_source="ldap",
        avatar_color=random.choice(AVATAR_COLORS),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def authenticate_user(
    db: AsyncSession,
    email: str,
    password: str,
) -> User | None:
    """Verify credentials via LDAP (if enabled) or local password, and return the user, or None."""
    # Try LDAP first when enabled (e.g. Windows domain)
    if settings.LDAP_ENABLED:
        ldap_info = authenticate_ldap(email.strip(), password)
        if ldap_info is not None:
            return await get_or_sync_ldap_user(
                db,
                email=ldap_info["email"],
                display_name=ldap_info["display_name"],
            )

    # Local auth
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if user is None or not verify_password(password, user.password_hash):
        return None
    return user


def create_tokens(user: User) -> dict:
    """Generate access + refresh JWT tokens for a user."""
    return {
        "access_token": create_access_token(subject=user.id),
        "refresh_token": create_refresh_token(subject=user.id),
        "token_type": "bearer",
    }
