"""JWT token creation / verification and password hashing utilities."""

from datetime import datetime, timedelta, timezone

import bcrypt
from jose import JWTError, jwt

from core.config import settings


def _truncate(password: str) -> str:
    """Truncate to 72 bytes — bcrypt's hard limit."""
    return password.encode("utf-8")[:72].decode("utf-8", errors="ignore")


def hash_password(password: str) -> str:
    """Hash a plain-text password."""
    pw = _truncate(password).encode("utf-8")
    return bcrypt.hashpw(pw, bcrypt.gensalt()).decode("utf-8")


# Sentinel stored in User.password_hash for LDAP-authenticated users (password verified by AD).
LDAP_PASSWORD_SENTINEL = "LDAP"

def verify_password(plain: str, hashed: str) -> bool:
    """Verify a plain-text password against a hash. LDAP users use a sentinel and are not verified here."""
    if hashed == LDAP_PASSWORD_SENTINEL:
        return False
    pw = _truncate(plain).encode("utf-8")
    return bcrypt.checkpw(pw, hashed.encode("utf-8"))


def create_access_token(subject: str, expires_delta: timedelta | None = None) -> str:
    """Create a short-lived JWT access token."""
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return jwt.encode(
        {"sub": subject, "exp": expire, "type": "access"},
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )


def create_refresh_token(subject: str) -> str:
    """Create a long-lived JWT refresh token."""
    expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    return jwt.encode(
        {"sub": subject, "exp": expire, "type": "refresh"},
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )


def decode_token(token: str) -> dict | None:
    """Decode and validate a JWT token. Returns payload or None."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None
