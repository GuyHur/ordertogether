"""Order routes: CRUD, join, leave, status updates, comments, receipts."""

import shutil
import uuid
from pathlib import Path

from fastapi import APIRouter, HTTPException, Query, UploadFile, File, status

from core.deps import DB, CurrentUser
from models.comment import OrderComment
from models.notification import Notification
from models.order import OrderStatus
from models.receipt import Receipt
from schemas.comment import CommentCreate, CommentRead
from schemas.receipt import ReceiptRead
from schemas.order import (
    InviteCreate,
    InviteRead,
    OrderCreate,
    OrderJoin,
    OrderListItem,
    OrderRead,
    OrderStatusUpdate,
    OrderUpdate,
)
from services.order_service import (
    create_invite_link,
    create_order,
    delete_order,
    get_order_by_id,
    get_order_invites,
    get_user_orders,
    join_order,
    kick_participant,
    leave_order,
    list_orders,
    revoke_invite,
    update_order,
    update_order_status,
)
from services.notification_service import notify_order_participants

from sqlalchemy import select

router = APIRouter(prefix="/api/orders", tags=["orders"])


def _parse_tags(raw: str | None) -> list[str]:
    """Parse comma-separated tags string into a list."""
    if not raw:
        return []
    return [t.strip() for t in raw.split(",") if t.strip()]


def _to_list_item(order) -> dict:
    """Convert an Order ORM instance to an OrderListItem-compatible dict."""
    return {
        "id": order.id,
        "title": order.title,
        "status": order.status.value if hasattr(order.status, "value") else order.status,
        "destination": order.destination,
        "group_order_id": order.group_order_id,
        "building": order.building,
        "location_note": order.location_note,
        "food_tags": _parse_tags(order.food_tags),
        "deadline": order.deadline,
        "created_at": order.created_at,
        "creator": {
            "id": order.creator.id,
            "display_name": order.creator.display_name,
            "avatar_color": order.creator.avatar_color,
        },
        "service": {
            "id": order.service.id,
            "name": order.service.name,
            "name_he": order.service.name_he,
            "icon_url": order.service.icon_url,
        },
        "participant_count": len(order.participants),
    }


def _to_read(order) -> dict:
    """Convert an Order ORM instance to an OrderRead-compatible dict."""
    data = _to_list_item(order)
    data["description"] = order.description
    data["order_link"] = order.order_link
    data["group_order_id"] = order.group_order_id
    data["updated_at"] = order.updated_at
    data["participants"] = [
        {
            "id": p.id,
            "user": {
                "id": p.user.id,
                "email": p.user.email,
                "display_name": p.user.display_name,
                "avatar_color": p.user.avatar_color,
            },
            "note": p.note,
            "items_summary": p.items_summary,
            "joined_at": p.created_at,
        }
        for p in order.participants
    ]
    return data


@router.get("", response_model=list[OrderListItem])
async def list_all_orders(
    db: DB,
    status_filter: str | None = Query(None, alias="status"),
    service_id: str | None = None,
    building: str | None = None,
    search: str | None = Query(None),
    food_tag: str | None = Query(None),
):
    """List all orders, optionally filtered."""
    status_enum = None
    if status_filter:
        try:
            status_enum = OrderStatus(status_filter)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid status: {status_filter}")

    orders = await list_orders(
        db, status=status_enum, service_id=service_id,
        building=building, search=search, food_tag=food_tag,
    )
    return [_to_list_item(o) for o in orders]


@router.post("", response_model=OrderRead, status_code=status.HTTP_201_CREATED)
async def create_new_order(body: OrderCreate, current_user: CurrentUser, db: DB):
    """Create a new group order. The creator is auto-added as a participant."""
    order = await create_order(
        db,
        creator=current_user,
        service_id=body.service_id,
        title=body.title,
        description=body.description,
        destination=body.destination,
        order_link=body.order_link,
        group_order_id=body.group_order_id,
        building=body.building,
        location_note=body.location_note,
        food_tags=body.food_tags,
        deadline=body.deadline,
    )
    return _to_read(order)


@router.get("/mine")
async def get_my_orders(current_user: CurrentUser, db: DB):
    """Get orders created by and joined by the current user."""
    result = await get_user_orders(db, current_user.id)
    return {
        "created": [_to_list_item(o) for o in result["created"]],
        "joined": [_to_list_item(o) for o in result["joined"]],
    }


@router.get("/{order_id}", response_model=OrderRead)
async def get_order(order_id: str, db: DB):
    """Get order details with all participants."""
    order = await get_order_by_id(db, order_id)
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    return _to_read(order)


@router.put("/{order_id}", response_model=OrderRead)
async def update_existing_order(
    order_id: str, body: OrderUpdate, current_user: CurrentUser, db: DB
):
    """Update an order (creator only)."""
    order = await update_order(
        db,
        order_id=order_id,
        user_id=current_user.id,
        title=body.title,
        description=body.description,
        destination=body.destination,
        order_link=body.order_link,
        group_order_id=body.group_order_id,
        building=body.building,
        location_note=body.location_note,
        food_tags=",".join(body.food_tags) if body.food_tags else None,
        deadline=body.deadline,
    )
    if order is None:
        raise HTTPException(status_code=403, detail="Not allowed or order not found")
    return _to_read(order)


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_order(order_id: str, current_user: CurrentUser, db: DB):
    """Cancel/delete an order (creator only)."""
    success = await delete_order(db, order_id=order_id, user_id=current_user.id)
    if not success:
        raise HTTPException(status_code=403, detail="Not allowed or order not found")


@router.post("/{order_id}/join", status_code=status.HTTP_201_CREATED)
async def join_existing_order(
    order_id: str, body: OrderJoin, current_user: CurrentUser, db: DB
):
    """Join an existing open order."""
    try:
        await join_order(
            db,
            order_id=order_id,
            user=current_user,
            note=body.note,
            items_summary=body.items_summary,
            invite_token=body.invite_token,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    order = await get_order_by_id(db, order_id)
    await notify_order_participants(
        db, order,
        message=f"{current_user.display_name} joined the order \"{order.title}\"",
        type="joined",
        exclude_user_id=current_user.id,
    )
    return _to_read(order)


@router.delete("/{order_id}/leave", status_code=status.HTTP_204_NO_CONTENT)
async def leave_existing_order(order_id: str, current_user: CurrentUser, db: DB):
    """Leave an order you previously joined."""
    success = await leave_order(db, order_id=order_id, user_id=current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Not a participant of this order")


@router.delete("/{order_id}/participants/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def kick_order_participant(order_id: str, user_id: str, current_user: CurrentUser, db: DB):
    """Kick a participant from an order (creator only)."""
    success = await kick_participant(
        db, order_id=order_id, creator_id=current_user.id, participant_id=user_id
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to kick participant (not allowed, or participant not found)",
        )
    from services.notification_service import create_notification
    order = await get_order_by_id(db, order_id)
    await create_notification(
        db, user_id=user_id,
        message=f"You were removed from the order \"{order.title}\"",
        type="kicked", order_id=order_id,
    )


@router.put("/{order_id}/status", response_model=OrderRead)
async def change_order_status(
    order_id: str, body: OrderStatusUpdate, current_user: CurrentUser, db: DB
):
    """Change order status (creator only)."""
    try:
        order = await update_order_status(
            db, order_id=order_id, user_id=current_user.id, new_status=body.status
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if order is None:
        raise HTTPException(status_code=403, detail="Not allowed or order not found")
    await notify_order_participants(
        db, order,
        message=f"Order \"{order.title}\" status changed to {body.status.replace('_', ' ')}",
        type="status_change",
        exclude_user_id=current_user.id,
    )
    return _to_read(order)


# ── Invite link endpoints ────────────────────────────────────────────────

@router.post("/{order_id}/invites", response_model=InviteRead, status_code=status.HTTP_201_CREATED)
async def create_new_invite(
    order_id: str, body: InviteCreate, current_user: CurrentUser, db: DB
):
    """Create an invite link for an invite_only order (creator only)."""
    try:
        invite = await create_invite_link(
            db, order_id=order_id, user_id=current_user.id, max_uses=body.max_uses
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return invite


@router.get("/{order_id}/invites", response_model=list[InviteRead])
async def list_invites(order_id: str, current_user: CurrentUser, db: DB):
    """List active invite links for an order (creator only)."""
    return await get_order_invites(db, order_id=order_id, user_id=current_user.id)


@router.delete("/{order_id}/invites/{invite_id}", status_code=status.HTTP_204_NO_CONTENT)
async def revoke_invite_link(
    order_id: str, invite_id: str, current_user: CurrentUser, db: DB
):
    """Revoke a specific invite link (creator only)."""
    success = await revoke_invite(db, order_id=order_id, invite_id=invite_id, user_id=current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Invite not found or not allowed")


# ── Comment endpoints ────────────────────────────────────────────────────

@router.get("/{order_id}/comments", response_model=list[CommentRead])
async def list_comments(order_id: str, current_user: CurrentUser, db: DB):
    """Get all comments for an order."""
    result = await db.execute(
        select(OrderComment)
        .where(OrderComment.order_id == order_id)
        .order_by(OrderComment.created_at.asc())
    )
    return list(result.scalars().all())


@router.post("/{order_id}/comments", response_model=CommentRead, status_code=status.HTTP_201_CREATED)
async def add_comment(order_id: str, body: CommentCreate, current_user: CurrentUser, db: DB):
    """Post a comment on an order."""
    order = await get_order_by_id(db, order_id)
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    comment = OrderComment(
        order_id=order_id,
        user_id=current_user.id,
        body=body.body,
    )
    db.add(comment)
    await db.commit()
    await db.refresh(comment)
    # Notify other participants
    await notify_order_participants(
        db, order,
        message=f"{current_user.display_name} commented on \"{order.title}\"",
        type="comment",
        exclude_user_id=current_user.id,
    )
    return comment


# ── Receipt endpoints ────────────────────────────────────────────────────

UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads" / "receipts"


@router.post("/{order_id}/receipts", response_model=ReceiptRead, status_code=status.HTTP_201_CREATED)
async def upload_receipt(
    order_id: str,
    current_user: CurrentUser,
    db: DB,
    file: UploadFile = File(...),
):
    """Upload a receipt image for an order (creator only)."""
    order = await get_order_by_id(db, order_id)
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the order creator can upload receipts")

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    ext = Path(file.filename).suffix if file.filename else ".jpg"
    unique_name = f"{uuid.uuid4().hex}{ext}"
    dest = UPLOAD_DIR / unique_name
    with open(dest, "wb") as f:
        shutil.copyfileobj(file.file, f)

    receipt = Receipt(
        order_id=order_id,
        uploaded_by=current_user.id,
        filename=file.filename or unique_name,
        file_path=str(dest),
        content_type=file.content_type or "image/jpeg",
    )
    db.add(receipt)
    await db.commit()
    await db.refresh(receipt)

    await notify_order_participants(
        db, order,
        message=f"A receipt was uploaded for \"{order.title}\"",
        type="info",
        exclude_user_id=current_user.id,
    )
    return receipt


@router.get("/{order_id}/receipts", response_model=list[ReceiptRead])
async def list_receipts(order_id: str, current_user: CurrentUser, db: DB):
    """List all receipts for an order."""
    result = await db.execute(
        select(Receipt).where(Receipt.order_id == order_id).order_by(Receipt.created_at.desc())
    )
    return list(result.scalars().all())


@router.get("/{order_id}/receipts/{receipt_id}/download")
async def download_receipt(order_id: str, receipt_id: str, current_user: CurrentUser, db: DB):
    """Download a receipt image."""
    from fastapi.responses import FileResponse
    result = await db.execute(
        select(Receipt).where(Receipt.id == receipt_id, Receipt.order_id == order_id)
    )
    receipt = result.scalar_one_or_none()
    if receipt is None:
        raise HTTPException(status_code=404, detail="Receipt not found")
    return FileResponse(receipt.file_path, media_type=receipt.content_type, filename=receipt.filename)
