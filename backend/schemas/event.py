from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from models.event import EventParticipantStatusEnum

class EventBase(BaseModel):
    title: str
    description: Optional[str] = None
    event_date: datetime
    location: Optional[str] = None
    is_online: bool = False
    meeting_link: Optional[str] = None
    guest_limit: Optional[int] = None
    organizer_id: int

class EventCreate(EventBase):
    pass

class EventDisplay(EventBase):
    id: int

    class Config:
        model_config = ConfigDict(from_attributes=True)

class EventParticipantBase(BaseModel):
    status: EventParticipantStatusEnum = EventParticipantStatusEnum.registered
    user_id: int
    event_id: int

class EventParticipantDisplay(EventParticipantBase):
    registered_at: datetime

    class Config:
        model_config = ConfigDict(from_attributes=True)
