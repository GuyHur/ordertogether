"""Authentication business logic."""

import random

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.security import create_access_token, create_refresh_token, hash_password, verify_password
from models.user import User

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


async def authenticate_user(
    db: AsyncSession,
    email: str,
    password: str,
) -> User | None:
    """Verify credentials and return the user, or None."""
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
