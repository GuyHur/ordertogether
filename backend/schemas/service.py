"""DeliveryService Pydantic schemas."""

from pydantic import BaseModel


class DeliveryServiceRead(BaseModel):
    id: str
    name: str
    name_he: str | None = None
    icon_url: str
    site_url: str

    model_config = {"from_attributes": True}
