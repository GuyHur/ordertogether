"""Notification service — create and query in-app notifications."""

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from models.notification import Notification
from models.order import Order, OrderParticipant


async def create_notification(
    db: AsyncSession,
    user_id: str,
    message: str,
    type: str = "info",
    order_id: str | None = None,
) -> Notification:
    """Create a single notification for a user."""
    notif = Notification(
        user_id=user_id,
        order_id=order_id,
        message=message,
        type=type,
    )
    db.add(notif)
    await db.commit()
    await db.refresh(notif)
    return notif


async def notify_order_participants(
    db: AsyncSession,
    order: Order,
    message: str,
    type: str = "info",
    exclude_user_id: str | None = None,
) -> None:
    """Send a notification to all participants (and creator) of an order, optionally excluding one user."""
    user_ids = set()
    user_ids.add(order.creator_id)
    for p in order.participants:
        user_ids.add(p.user_id)

    if exclude_user_id:
        user_ids.discard(exclude_user_id)

    for uid in user_ids:
        notif = Notification(
            user_id=uid,
            order_id=order.id,
            message=message,
            type=type,
        )
        db.add(notif)
    await db.commit()


async def get_user_notifications(
    db: AsyncSession,
    user_id: str,
    unread_only: bool = False,
    limit: int = 50,
) -> list[Notification]:
    """Get notifications for a user, newest first."""
    stmt = select(Notification).where(Notification.user_id == user_id)
    if unread_only:
        stmt = stmt.where(Notification.is_read == False)  # noqa: E712
    stmt = stmt.order_by(Notification.created_at.desc()).limit(limit)
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def get_unread_count(db: AsyncSession, user_id: str) -> int:
    """Return the count of unread notifications."""
    from sqlalchemy import func
    result = await db.execute(
        select(func.count()).select_from(Notification).where(
            Notification.user_id == user_id,
            Notification.is_read == False,  # noqa: E712
        )
    )
    return result.scalar() or 0


async def mark_all_read(db: AsyncSession, user_id: str) -> None:
    """Mark all notifications as read for a user."""
    await db.execute(
        update(Notification)
        .where(Notification.user_id == user_id, Notification.is_read == False)  # noqa: E712
        .values(is_read=True)
    )
    await db.commit()


async def mark_one_read(db: AsyncSession, user_id: str, notification_id: str) -> None:
    """Mark a single notification as read."""
    await db.execute(
        update(Notification)
        .where(Notification.id == notification_id, Notification.user_id == user_id)
        .values(is_read=True)
    )
    await db.commit()
