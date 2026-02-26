"""Notification Pydantic schemas."""

from datetime import datetime

from pydantic import BaseModel


class NotificationRead(BaseModel):
    id: str
    order_id: str | None = None
    message: str
    type: str = "info"
    is_read: bool = False
    created_at: datetime | None = None

    model_config = {"from_attributes": True}
