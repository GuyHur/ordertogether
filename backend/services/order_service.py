"""Order business logic."""

from datetime import datetime, timezone, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models.invite import InviteLink
from models.order import Order, OrderParticipant, OrderStatus
from models.user import User
from core.config import settings


async def create_order(
    db: AsyncSession,
    creator: User,
    service_id: str,
    title: str,
    description: str | None = None,
    destination: str | None = None,
    order_link: str | None = None,
    group_order_id: str | None = None,
    building: str | None = None,
    location_note: str | None = None,
    food_tags: list[str] | None = None,
    deadline: datetime | None = None,
) -> Order:
    """Create a new group order."""
    order = Order(
        creator_id=creator.id,
        service_id=service_id,
        title=title,
        description=description,
        destination=destination,
        order_link=order_link,
        group_order_id=group_order_id,
        building=building,
        location_note=location_note,
        food_tags=",".join(food_tags) if food_tags else None,
        deadline=deadline,
        status=OrderStatus.OPEN,
    )
    db.add(order)
    await db.commit()
    await db.refresh(order)

    # Creator auto-joins the order
    participant = OrderParticipant(
        order_id=order.id,
        user_id=creator.id,
        note="Order creator",
    )
    db.add(participant)
    await db.commit()

    # Re-fetch with relationships
    return await get_order_by_id(db, order.id)


async def get_order_by_id(db: AsyncSession, order_id: str) -> Order | None:
    """Fetch a single order with all relationships loaded."""
    result = await db.execute(
        select(Order)
        .options(
            selectinload(Order.creator),
            selectinload(Order.service),
            selectinload(Order.participants).selectinload(OrderParticipant.user),
        )
        .where(Order.id == order_id)
    )
    return result.scalar_one_or_none()


async def list_orders(
    db: AsyncSession,
    status: OrderStatus | None = None,
    service_id: str | None = None,
    building: str | None = None,
    search: str | None = None,
    food_tag: str | None = None,
) -> list[Order]:
    """List orders, optionally filtered by status, service, building, search text, or food tag."""
    cutoff = datetime.now(timezone.utc) - timedelta(hours=settings.ORDER_EXPIRATION_HOURS)
    
    query = (
        select(Order)
        .options(
            selectinload(Order.creator),
            selectinload(Order.service),
            selectinload(Order.participants).selectinload(OrderParticipant.user),
        )
        .where(Order.created_at >= cutoff)
        .order_by(Order.created_at.desc())
    )

    if status:
        query = query.where(Order.status == status)
    if service_id:
        query = query.where(Order.service_id == service_id)
    if building:
        query = query.where(Order.building == building)
    if search:
        pattern = f"%{search}%"
        query = query.where(
            Order.title.ilike(pattern) | Order.description.ilike(pattern)
        )
    if food_tag:
        query = query.where(Order.food_tags.ilike(f"%{food_tag}%"))

    result = await db.execute(query)
    return list(result.scalars().all())


async def get_user_orders(db: AsyncSession, user_id: str) -> dict:
    """Get orders created by and joined by a user."""
    cutoff = datetime.now(timezone.utc) - timedelta(hours=settings.ORDER_EXPIRATION_HOURS)
    
    # Created orders
    created_result = await db.execute(
        select(Order)
        .options(
            selectinload(Order.creator),
            selectinload(Order.service),
            selectinload(Order.participants).selectinload(OrderParticipant.user),
        )
        .where(Order.creator_id == user_id)
        .where(Order.created_at >= cutoff)
        .order_by(Order.created_at.desc())
    )
    created = list(created_result.scalars().all())

    # Joined orders (but not created by this user)
    joined_result = await db.execute(
        select(Order)
        .options(
            selectinload(Order.creator),
            selectinload(Order.service),
            selectinload(Order.participants).selectinload(OrderParticipant.user),
        )
        .join(OrderParticipant, Order.id == OrderParticipant.order_id)
        .where(OrderParticipant.user_id == user_id)
        .where(Order.creator_id != user_id)
        .where(Order.created_at >= cutoff)
        .order_by(Order.created_at.desc())
    )
    joined = list(joined_result.scalars().all())

    return {"created": created, "joined": joined}


async def join_order(
    db: AsyncSession,
    order_id: str,
    user: User,
    note: str | None = None,
    items_summary: str | None = None,
    invite_token: str | None = None,
) -> OrderParticipant:
    """Add a user as a participant to an order."""
    order = await get_order_by_id(db, order_id)
    if order is None:
        raise ValueError("Order not found")

    # Check status allows joining
    if order.status == OrderStatus.INVITE_ONLY:
        if not invite_token:
            raise ValueError("This order requires an invite link to join")
        # Validate the invite token
        invite = await _get_invite_by_token(db, order_id, invite_token)
        if invite is None:
            raise ValueError("Invalid or expired invite link")
        # Increment use count
        invite.use_count += 1
    elif order.status != OrderStatus.OPEN:
        raise ValueError("Order is no longer accepting participants")

    # Check if already joined
    for p in order.participants:
        if p.user_id == user.id:
            raise ValueError("Already joined this order")

    participant = OrderParticipant(
        order_id=order_id,
        user_id=user.id,
        note=note,
        items_summary=items_summary,
    )
    db.add(participant)
    await db.commit()
    await db.refresh(participant)
    return participant


async def leave_order(db: AsyncSession, order_id: str, user_id: str) -> bool:
    """Remove a participant from an order."""
    result = await db.execute(
        select(OrderParticipant).where(
            OrderParticipant.order_id == order_id,
            OrderParticipant.user_id == user_id,
        )
    )
    participant = result.scalar_one_or_none()
    if participant is None:
        return False

    await db.delete(participant)
    await db.commit()
    return True


async def kick_participant(db: AsyncSession, order_id: str, creator_id: str, participant_id: str) -> bool:
    """Remove a participant from an order (creator only)."""
    order = await get_order_by_id(db, order_id)
    if order is None or order.creator_id != creator_id:
        return False

    result = await db.execute(
        select(OrderParticipant).where(
            OrderParticipant.order_id == order_id,
            OrderParticipant.user_id == participant_id,
        )
    )
    participant = result.scalar_one_or_none()
    if participant is None:
        return False

    await db.delete(participant)
    await db.commit()
    return True


async def update_order(
    db: AsyncSession,
    order_id: str,
    user_id: str,
    **kwargs,
) -> Order | None:
    """Update an order (creator-only fields)."""
    order = await get_order_by_id(db, order_id)
    if order is None or order.creator_id != user_id:
        return None

    for key, value in kwargs.items():
        if value is not None and hasattr(order, key):
            setattr(order, key, value)

    await db.commit()
    return await get_order_by_id(db, order_id)


async def update_order_status(
    db: AsyncSession,
    order_id: str,
    user_id: str,
    new_status: str,
) -> Order | None:
    """Update order status (creator only). Deactivates invite links when leaving invite_only."""
    order = await get_order_by_id(db, order_id)
    if order is None or order.creator_id != user_id:
        return None

    old_status = order.status

    try:
        order.status = OrderStatus(new_status)
    except ValueError:
        raise ValueError(f"Invalid status: {new_status}")

    # When leaving invite_only, deactivate all invite links
    if old_status == OrderStatus.INVITE_ONLY and order.status != OrderStatus.INVITE_ONLY:
        await _deactivate_all_invites(db, order_id)

    await db.commit()
    return await get_order_by_id(db, order_id)


async def delete_order(db: AsyncSession, order_id: str, user_id: str) -> bool:
    """Cancel/delete an order (creator only)."""
    order = await get_order_by_id(db, order_id)
    if order is None or order.creator_id != user_id:
        return False

    await db.delete(order)
    await db.commit()
    return True


# ── Invite link helpers ──────────────────────────────────────────────────

async def _get_invite_by_token(
    db: AsyncSession, order_id: str, token: str
) -> InviteLink | None:
    """Look up an active, valid invite token for an order."""
    result = await db.execute(
        select(InviteLink).where(
            InviteLink.order_id == order_id,
            InviteLink.token == token,
            InviteLink.is_active == True,  # noqa: E712
        )
    )
    invite = result.scalar_one_or_none()
    if invite is None or not invite.is_valid:
        return None
    return invite


async def _deactivate_all_invites(db: AsyncSession, order_id: str) -> None:
    """Deactivate every invite link for an order."""
    result = await db.execute(
        select(InviteLink).where(
            InviteLink.order_id == order_id,
            InviteLink.is_active == True,  # noqa: E712
        )
    )
    for invite in result.scalars().all():
        invite.is_active = False


async def create_invite_link(
    db: AsyncSession,
    order_id: str,
    user_id: str,
    max_uses: int | None = None,
) -> InviteLink:
    """Create an invite link for an order (creator only, invite_only status)."""
    order = await get_order_by_id(db, order_id)
    if order is None:
        raise ValueError("Order not found")
    if order.creator_id != user_id:
        raise ValueError("Only the order creator can create invite links")
    if order.status != OrderStatus.INVITE_ONLY:
        raise ValueError("Order must be in invite_only status to create invite links")

    invite = InviteLink(order_id=order_id, max_uses=max_uses)
    db.add(invite)
    await db.commit()
    await db.refresh(invite)
    return invite


async def get_order_invites(
    db: AsyncSession, order_id: str, user_id: str
) -> list[InviteLink]:
    """List active invite links for an order (creator only)."""
    order = await get_order_by_id(db, order_id)
    if order is None or order.creator_id != user_id:
        return []
    result = await db.execute(
        select(InviteLink)
        .where(InviteLink.order_id == order_id, InviteLink.is_active == True)  # noqa: E712
        .order_by(InviteLink.created_at.desc())
    )
    return list(result.scalars().all())


async def revoke_invite(
    db: AsyncSession, order_id: str, invite_id: str, user_id: str
) -> bool:
    """Revoke a specific invite link (creator only)."""
    order = await get_order_by_id(db, order_id)
    if order is None or order.creator_id != user_id:
        return False
    result = await db.execute(
        select(InviteLink).where(
            InviteLink.id == invite_id,
            InviteLink.order_id == order_id,
        )
    )
    invite = result.scalar_one_or_none()
    if invite is None:
        return False
    invite.is_active = False
    await db.commit()
    return True
