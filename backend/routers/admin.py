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
