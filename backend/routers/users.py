"""User profile routes."""

from fastapi import APIRouter

from core.deps import DB, CurrentUser
from models.user import User
from schemas.user import UserRead, UserUpdate

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/me", response_model=UserRead)
async def get_profile(current_user: CurrentUser):
    """Get the current user's profile."""
    return current_user


@router.put("/me", response_model=UserRead)
async def update_profile(body: UserUpdate, current_user: CurrentUser, db: DB):
    """Update the current user's profile."""
    if body.display_name is not None:
        current_user.display_name = body.display_name
    if body.building is not None:
        current_user.building = body.building
    if body.avatar_color is not None:
        current_user.avatar_color = body.avatar_color

    await db.commit()
    await db.refresh(current_user)
    return current_user
