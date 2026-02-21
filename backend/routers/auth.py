"""Authentication routes: register, login, refresh."""

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from core.deps import DB, CurrentUser
from core.security import decode_token, create_access_token
from models.user import User
from schemas.auth import LoginRequest, RefreshRequest, RegisterRequest, TokenResponse
from schemas.user import UserRead
from services.auth_service import authenticate_user, create_tokens, register_user

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(body: RegisterRequest, db: DB):
    """Register a new user and return JWT tokens."""
    try:
        user = await register_user(
            db,
            email=body.email,
            password=body.password,
            display_name=body.display_name,
            building=body.building,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))

    return create_tokens(user)


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: DB):
    """Authenticate and return JWT tokens."""
    user = await authenticate_user(db, username=body.username, password=body.password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )
    return create_tokens(user)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(body: RefreshRequest, db: DB):
    """Exchange a refresh token for new access + refresh tokens."""
    payload = decode_token(body.refresh_token)
    if payload is None or payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    return create_tokens(user)


@router.get("/me", response_model=UserRead)
async def get_me(current_user: CurrentUser):
    """Return the current authenticated user's profile."""
    return current_user
