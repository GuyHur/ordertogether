"""Receipt Pydantic schemas."""

from datetime import datetime

from pydantic import BaseModel

from schemas.user import UserRead


class ReceiptRead(BaseModel):
    id: str
    filename: str
    content_type: str
    ocr_text: str | None = None
    uploaded_by: str
    created_at: datetime | None = None

    model_config = {"from_attributes": True}
