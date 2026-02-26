from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class PollUser(BaseModel):
    id: str
    display_name: str
    avatar_color: str

class PollService(BaseModel):
    id: str
    name: str
    name_he: Optional[str] = None
    icon_url: str

class PollOptionBase(BaseModel):
    service_id: Optional[str] = None
    text: Optional[str] = None

class PollOptionCreate(PollOptionBase):
    pass

class PollOptionRead(PollOptionBase):
    id: str
    poll_id: str
    service: Optional[PollService] = None

    class Config:
        from_attributes = True

class PollVoteRead(BaseModel):
    id: str
    option_id: str
    user_id: str
    user: PollUser

    class Config:
        from_attributes = True

class PollCreate(BaseModel):
    title: str
    building: Optional[str] = None
    destination: Optional[str] = None
    options: list[PollOptionCreate]

class PollRead(BaseModel):
    id: str
    title: str
    building: Optional[str] = None
    destination: Optional[str] = None
    status: str
    created_at: datetime
    creator: PollUser
    options: list[PollOptionRead]
    votes: list[PollVoteRead]

    class Config:
        from_attributes = True
