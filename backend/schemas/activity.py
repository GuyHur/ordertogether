from datetime import datetime
from pydantic import BaseModel
from typing import Optional

class ActivityUser(BaseModel):
    id: str
    display_name: str
    avatar_color: str

class ActivityOrder(BaseModel):
    id: str
    title: str

class ActivityRead(BaseModel):
    id: str
    message: str
    created_at: datetime
    user: Optional[ActivityUser] = None
    order: Optional[ActivityOrder] = None

    class Config:
        from_attributes = True
