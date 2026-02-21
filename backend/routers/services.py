"""Delivery-service routes."""

from fastapi import APIRouter
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.deps import DB
from models.delivery_service import DeliveryService
from schemas.service import DeliveryServiceRead

router = APIRouter(prefix="/api/services", tags=["services"])


@router.get("", response_model=list[DeliveryServiceRead])
async def get_services(db: DB):
    """Return the available delivery services."""
    result = await db.execute(select(DeliveryService).order_by(DeliveryService.name))
    return list(result.scalars().all())
