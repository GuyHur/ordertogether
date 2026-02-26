"""Comment Pydantic schemas."""

from datetime import datetime

from pydantic import BaseModel

from schemas.user import UserRead


class CommentCreate(BaseModel):
    body: str


class CommentRead(BaseModel):
    id: str
    body: str
    user: UserRead
    created_at: datetime | None = None

    model_config = {"from_attributes": True}
