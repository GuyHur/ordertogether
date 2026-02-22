from fastapi import APIRouter
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from core.deps import DB, CurrentUser
from models.activity import Activity
from schemas.activity import ActivityRead

router = APIRouter(prefix="/api/activities", tags=["activities"])

@router.get("", response_model=list[ActivityRead])
async def list_activities(db: DB, user: CurrentUser):
    stmt = (
        select(Activity)
        .options(selectinload(Activity.user), selectinload(Activity.order))
        .order_by(Activity.created_at.desc())
        .limit(20)
    )
    res = await db.execute(stmt)
    return res.scalars().all()
