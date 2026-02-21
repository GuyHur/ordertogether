"""Notification routes: list, count, mark-read."""

from fastapi import APIRouter, status

from core.deps import DB, CurrentUser
from schemas.notification import NotificationRead
from services.notification_service import (
    get_unread_count,
    get_user_notifications,
    mark_all_read,
    mark_one_read,
)

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.get("", response_model=list[NotificationRead])
async def list_notifications(current_user: CurrentUser, db: DB, unread: bool = False):
    """Return the current user's notifications."""
    return await get_user_notifications(db, current_user.id, unread_only=unread)


@router.get("/count")
async def notification_count(current_user: CurrentUser, db: DB):
    """Return the count of unread notifications."""
    count = await get_unread_count(db, current_user.id)
    return {"unread": count}


@router.post("/read-all", status_code=status.HTTP_204_NO_CONTENT)
async def read_all(current_user: CurrentUser, db: DB):
    """Mark all notifications as read."""
    await mark_all_read(db, current_user.id)


@router.post("/{notification_id}/read", status_code=status.HTTP_204_NO_CONTENT)
async def read_one(notification_id: str, current_user: CurrentUser, db: DB):
    """Mark a single notification as read."""
    await mark_one_read(db, current_user.id, notification_id)
