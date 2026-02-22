"""Admin routes: manage buildings, food tags, and delivery services."""

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from core.deps import DB, CurrentUser
from core.config import settings
from models.delivery_service import DeliveryService
from sqlalchemy import select, delete

router = APIRouter(prefix="/api/admin", tags=["admin"])

def _require_admin(user):
    """Raise 403 if user is not an admin."""
    if not user.is_admin and not user.is_superuser:
        raise HTTPException(status_code=403, detail="Not authorized. Admin access required.")

def _require_superuser(user):
    """Raise 403 if user is not a superuser."""
    if not user.is_superuser:
        raise HTTPException(status_code=403, detail="Not authorized. Superuser access required.")

# ── Users (Superuser Only) ───────────────────────────────────────────────

from models.user import User
from schemas.user import UserRead

@router.get("/users", response_model=list[UserRead])
async def list_users(current_user: CurrentUser, db: DB):
    """List all users."""
    _require_superuser(current_user)
    result = await db.execute(select(User).order_by(User.display_name))
    return list(result.scalars().all())

@router.put("/users/{user_id}/promote", response_model=UserRead)
async def promote_user(user_id: str, current_user: CurrentUser, db: DB):
    """Promote a user to admin."""
    _require_superuser(current_user)
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_admin = True
    await db.commit()
    await db.refresh(user)
    return user

@router.put("/users/{user_id}/demote", response_model=UserRead)
async def demote_user(user_id: str, current_user: CurrentUser, db: DB):
    """Demote a user from admin."""
    _require_superuser(current_user)
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.is_superuser:
        raise HTTPException(status_code=403, detail="Cannot demote a superuser")
    user.is_admin = False
    await db.commit()
    await db.refresh(user)
    return user


# ── Buildings ────────────────────────────────────────────────────────────


class BuildingBody(BaseModel):
    name: str


@router.get("/buildings")
async def list_buildings(current_user: CurrentUser):
    """List all configured buildings."""
    _require_admin(current_user)
    return settings.BUILDINGS


@router.post("/buildings", status_code=status.HTTP_201_CREATED)
async def add_building(body: BuildingBody, current_user: CurrentUser):
    """Add a new building."""
    _require_admin(current_user)
    if body.name in settings.BUILDINGS:
        raise HTTPException(status_code=400, detail="Building already exists")
    settings.BUILDINGS.append(body.name)
    return {"buildings": settings.BUILDINGS}


@router.delete("/buildings/{name}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_building(name: str, current_user: CurrentUser):
    """Remove a building."""
    _require_admin(current_user)
    if name not in settings.BUILDINGS:
        raise HTTPException(status_code=404, detail="Building not found")
    settings.BUILDINGS.remove(name)


# ── Food Tags ────────────────────────────────────────────────────────────


class FoodTagBody(BaseModel):
    name: str


@router.get("/food-tags")
async def list_food_tags(current_user: CurrentUser):
    """List all configured food tags."""
    _require_admin(current_user)
    return settings.FOOD_TAGS


@router.post("/food-tags", status_code=status.HTTP_201_CREATED)
async def add_food_tag(body: FoodTagBody, current_user: CurrentUser):
    """Add a new food tag."""
    _require_admin(current_user)
    if body.name in settings.FOOD_TAGS:
        raise HTTPException(status_code=400, detail="Tag already exists")
    settings.FOOD_TAGS.append(body.name)
    return {"food_tags": settings.FOOD_TAGS}


@router.delete("/food-tags/{name}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_food_tag(name: str, current_user: CurrentUser):
    """Remove a food tag."""
    _require_admin(current_user)
    if name not in settings.FOOD_TAGS:
        raise HTTPException(status_code=404, detail="Tag not found")
    settings.FOOD_TAGS.remove(name)


# ── Delivery Services ───────────────────────────────────────────────────


class ServiceBody(BaseModel):
    name: str
    name_he: str | None = None
    icon_url: str = "/api/icons/default.png"
    site_url: str = ""


@router.get("/services")
async def list_services(current_user: CurrentUser, db: DB):
    """List all delivery services."""
    _require_admin(current_user)
    result = await db.execute(select(DeliveryService))
    return list(result.scalars().all())


@router.post("/services", status_code=status.HTTP_201_CREATED)
async def add_service(body: ServiceBody, current_user: CurrentUser, db: DB):
    """Add a new delivery service."""
    _require_admin(current_user)
    import uuid
    svc = DeliveryService(
        id=str(uuid.uuid4()),
        name=body.name,
        name_he=body.name_he,
        icon_url=body.icon_url,
        site_url=body.site_url,
    )
    db.add(svc)
    await db.commit()
    await db.refresh(svc)
    return svc


@router.delete("/services/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_service(service_id: str, current_user: CurrentUser, db: DB):
    """Remove a delivery service."""
    _require_admin(current_user)
    result = await db.execute(select(DeliveryService).where(DeliveryService.id == service_id))
    svc = result.scalar_one_or_none()
    if svc is None:
        raise HTTPException(status_code=404, detail="Service not found")
    await db.delete(svc)
    await db.commit()

# ── BI Metrics ──────────────────────────────────────────────────────────

from collections import Counter
from datetime import timedelta
from sqlalchemy import func
from sqlalchemy.orm import selectinload
from models.order import Order, OrderParticipant
from models.poll import Poll
from models.activity import Activity

@router.get("/metrics")
async def get_metrics(current_user: CurrentUser, db: DB):
    """Generate extensive BI metrics regarding 100% of all platform orders"""
    _require_admin(current_user)
    
    query = select(Order).options(
        selectinload(Order.service),
        selectinload(Order.creator),
        selectinload(Order.participants)
    )
    result = await db.execute(query)
    orders = result.scalars().all()
    
    # Process into BI payload
    total_orders = len(orders)
    total_participants = sum(len(o.participants) for o in orders)
    
    status_counts = Counter(o.status.value if hasattr(o.status, 'value') else o.status for o in orders)
    service_counts = Counter(o.service.name for o in orders if o.service)
    building_counts = Counter(o.building for o in orders if o.building)
    
    hour_counts = Counter()
    day_counts = Counter()
    food_tag_counts = Counter()

    # Timeline grouped by date (YYYY-MM-DD)
    timeline_data = {}
    for o in orders:
        if o.food_tags:
            for tag in o.food_tags.split(','):
                t = tag.strip()
                if t: food_tag_counts[t] += 1

        if o.created_at:
            day = o.created_at.strftime("%Y-%m-%d")
            hour_counts[o.created_at.strftime("%H:00")] += 1
            day_counts[o.created_at.strftime("%A")] += 1

            if day not in timeline_data:
                timeline_data[day] = {"date": day, "orders": 0, "participants": 0}
            timeline_data[day]["orders"] += 1
            timeline_data[day]["participants"] += len(o.participants)
            
    timeline = sorted(list(timeline_data.values()), key=lambda x: x["date"])
    
    # Active Users (Creators vs Participants)
    creator_counts = Counter(o.creator.display_name for o in orders if o.creator)
    
    # Deliveries Saved (Assuming 1 delivery per order instead of 1 per participant)
    deliveries_saved = max(0, total_participants - total_orders)
    
    # Sort days of week properly
    days_order = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    by_day = [{"name": d, "value": day_counts.get(d, 0)} for d in days_order]
    
    # Sort hours properly
    hours_order = [f"{str(i).zfill(2)}:00" for i in range(24)]
    by_hour = [{"name": h, "value": hour_counts.get(h, 0)} for h in hours_order]

    # Polls and Activities counts
    total_polls = (await db.execute(select(func.count(Poll.id)))).scalar_one()
    total_activities = (await db.execute(select(func.count(Activity.id)))).scalar_one()

    return {
        "summary": {
            "total_orders": total_orders,
            "total_participants": total_participants,
            "deliveries_saved": deliveries_saved,
            "total_polls": total_polls,
            "total_activities": total_activities
        },
        "by_status": [{"name": k, "value": v} for k, v in status_counts.items()],
        "by_service": [{"name": k, "value": v} for k, v in service_counts.items()],
        "by_building": [{"name": k, "value": v} for k, v in building_counts.most_common(10)],
        "by_food_tag": [{"name": k, "value": v} for k, v in food_tag_counts.most_common(15)],
        "by_hour": by_hour,
        "by_day": by_day,
        "timeline": timeline[-30:], # Last 30 active local days minimum
        "top_creators": [{"name": k, "value": v} for k, v in creator_counts.most_common(5)]
    }
