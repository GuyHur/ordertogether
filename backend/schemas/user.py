"""User Pydantic schemas."""

from datetime import datetime

from pydantic import BaseModel, computed_field
from core.config import settings


class UserRead(BaseModel):
    id: str
    email: str | None = None
    display_name: str
    is_admin: bool = False
    is_superuser: bool = False
    building: str | None = None
    avatar_color: str | None = None
    created_at: datetime | None = None

    @computed_field
    def avatar_url(self) -> str | None:
        if settings.AVATAR_URL_TEMPLATE and self.display_name:
            import urllib.parse
            quoted_name = urllib.parse.quote(self.display_name)
            return settings.AVATAR_URL_TEMPLATE.replace("{name}", quoted_name)
        return None

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    display_name: str | None = None
    building: str | None = None
    avatar_color: str | None = None
