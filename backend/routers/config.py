"""App configuration routes — serves preset data to the frontend."""

from fastapi import APIRouter

from core.config import settings

router = APIRouter(prefix="/api/config", tags=["config"])


@router.get("")
async def get_app_config():
    """Return app-level configuration for the frontend (buildings, food tags, etc.)."""
    return {
        "buildings": settings.BUILDINGS,
        "food_tags": settings.FOOD_TAGS,
    }
