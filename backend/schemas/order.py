"""Order and OrderParticipant Pydantic schemas."""

from datetime import datetime

from pydantic import BaseModel

from schemas.user import UserRead


class ParticipantRead(BaseModel):
    id: str
    user: UserRead
    note: str | None = None
    items_summary: str | None = None
    joined_at: datetime | None = None

    model_config = {"from_attributes": True}


class OrderCreate(BaseModel):
    service_id: str
    title: str
    description: str | None = None
    destination: str | None = None
    order_link: str | None = None
    deadline: datetime | None = None


class OrderUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    destination: str | None = None
    order_link: str | None = None
    deadline: datetime | None = None


class OrderStatusUpdate(BaseModel):
    status: str  # "open", "locked", "ordered", "delivered", "cancelled"


class OrderJoin(BaseModel):
    note: str | None = None
    items_summary: str | None = None


class ServiceSummary(BaseModel):
    id: str
    name: str
    name_he: str | None = None
    icon_url: str

    model_config = {"from_attributes": True}


class CreatorSummary(BaseModel):
    id: str
    display_name: str
    avatar_color: str | None = None

    model_config = {"from_attributes": True}


class OrderRead(BaseModel):
    id: str
    title: str
    description: str | None = None
    status: str
    destination: str | None = None
    order_link: str | None = None
    deadline: datetime | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None
    creator: CreatorSummary
    service: ServiceSummary
    participants: list[ParticipantRead] = []
    participant_count: int = 0

    model_config = {"from_attributes": True}


class OrderListItem(BaseModel):
    id: str
    title: str
    status: str
    destination: str | None = None
    deadline: datetime | None = None
    created_at: datetime | None = None
    creator: CreatorSummary
    service: ServiceSummary
    participant_count: int = 0

    model_config = {"from_attributes": True}
