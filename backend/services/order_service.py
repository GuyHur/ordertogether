"""Order business logic."""

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models.order import Order, OrderParticipant, OrderStatus
from models.user import User


async def create_order(
    db: AsyncSession,
    creator: User,
    service_id: str,
    title: str,
    description: str | None = None,
    destination: str | None = None,
    order_link: str | None = None,
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
) -> list[Order]:
    """List orders, optionally filtered by status, service, or building."""
    query = (
        select(Order)
        .options(
            selectinload(Order.creator),
            selectinload(Order.service),
            selectinload(Order.participants).selectinload(OrderParticipant.user),
        )
        .order_by(Order.created_at.desc())
    )

    if status:
        query = query.where(Order.status == status)
    if service_id:
        query = query.where(Order.service_id == service_id)
    if building:
        query = query.join(User, Order.creator_id == User.id).where(User.building == building)

    result = await db.execute(query)
    return list(result.scalars().all())


async def get_user_orders(db: AsyncSession, user_id: str) -> dict:
    """Get orders created by and joined by a user."""
    # Created orders
    created_result = await db.execute(
        select(Order)
        .options(
            selectinload(Order.creator),
            selectinload(Order.service),
            selectinload(Order.participants).selectinload(OrderParticipant.user),
        )
        .where(Order.creator_id == user_id)
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
) -> OrderParticipant:
    """Add a user as a participant to an order."""
    order = await get_order_by_id(db, order_id)
    if order is None:
        raise ValueError("Order not found")
    if order.status != OrderStatus.OPEN:
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
    """Update order status (creator only)."""
    order = await get_order_by_id(db, order_id)
    if order is None or order.creator_id != user_id:
        return None

    try:
        order.status = OrderStatus(new_status)
    except ValueError:
        raise ValueError(f"Invalid status: {new_status}")

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
