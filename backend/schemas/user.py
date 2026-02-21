"""User Pydantic schemas."""

from datetime import datetime

from pydantic import BaseModel


class UserRead(BaseModel):
    id: str
    email: str | None = None
    display_name: str
    is_admin: bool = False
    is_superuser: bool = False
    building: str | None = None
    avatar_color: str | None = None
    created_at: datetime | None = None

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    display_name: str | None = None
    building: str | None = None
    avatar_color: str | None = None
