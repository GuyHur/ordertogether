"""Authentication business logic."""

import random

from sqlalchemy import select, func
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
    email: str | None,
    password: str,
    display_name: str,
    building: str | None = None,
) -> User:
    """Create a new user account."""
    if email:
        # Check if email already exists
        result = await db.execute(select(User).where(User.email == email))
        if result.scalar_one_or_none() is not None:
            raise ValueError("Email already registered")

    # Check if username already exists
    result = await db.execute(select(User).where(User.display_name == display_name))
    if result.scalar_one_or_none() is not None:
        raise ValueError("Username already taken")

    # Superuser logic
    is_superuser = False
    if settings.SUPERUSER_USERNAME and display_name.lower() == settings.SUPERUSER_USERNAME.lower():
        is_superuser = True

    user = User(
        email=email if email else None,
        display_name=display_name,
        password_hash=hash_password(password),
        building=building,
        is_admin=is_superuser,  # A superuser is also an admin
        is_superuser=is_superuser,
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
    ldap_is_superuser: bool = False,
) -> User:
    """Get existing user by email or create one for LDAP (auth_source=ldap, placeholder password)."""
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    
    # Also evaluate SUPERUSER_USERNAME config setting for LDAP users
    is_configured_superuser = False
    if settings.SUPERUSER_USERNAME and display_name.lower() == settings.SUPERUSER_USERNAME.lower():
        is_configured_superuser = True
        
    final_is_superuser = ldap_is_superuser or is_configured_superuser
    
    if user is not None:
        if user.auth_source != "ldap":
            user.auth_source = "ldap"
            user.password_hash = LDAP_PASSWORD_SENTINEL
        
        # Superuser promotion from LDAP sync or config
        if final_is_superuser and not user.is_superuser:
            user.is_superuser = True
            user.is_admin = True
            
        user.display_name = display_name
        await db.commit()
        await db.refresh(user)
        return user
        
    user = User(
        email=email,
        display_name=display_name,
        password_hash=LDAP_PASSWORD_SENTINEL,
        auth_source="ldap",
        is_admin=final_is_superuser,
        is_superuser=final_is_superuser,
        avatar_color=random.choice(AVATAR_COLORS),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def authenticate_user(
    db: AsyncSession,
    username: str,
    password: str,
) -> User | None:
    """Verify credentials via LDAP (if enabled) or local password, and return the user, or None."""
    # Try LDAP first when enabled (e.g. Windows domain)
    if settings.LDAP_ENABLED:
        ldap_info = authenticate_ldap(username.strip(), password)
        if ldap_info is not None:
            return await get_or_sync_ldap_user(
                db,
                email=ldap_info["email"],
                display_name=ldap_info["display_name"],
                ldap_is_superuser=ldap_info.get("is_superuser", False),
            )

    # Local auth
    result = await db.execute(select(User).where(User.display_name == username.strip()))
    user = result.scalar_one_or_none()
    if user is None or not verify_password(password, user.password_hash):
        return None
        
    # Evaluate superuser upon login as well in case config changed
    is_configured_superuser = False
    if settings.SUPERUSER_USERNAME and user.display_name.lower() == settings.SUPERUSER_USERNAME.lower():
        is_configured_superuser = True
        
    if is_configured_superuser and not user.is_superuser:
        user.is_superuser = True
        user.is_admin = True
        await db.commit()
        await db.refresh(user)
        
    return user


def create_tokens(user: User) -> dict:
    """Generate access + refresh JWT tokens for a user."""
    return {
        "access_token": create_access_token(subject=user.id),
        "refresh_token": create_refresh_token(subject=user.id),
        "token_type": "bearer",
    }
