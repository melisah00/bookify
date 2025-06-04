from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field
from models.event import EventParticipantStatusEnum, EventFormatEnum

class EventTagBase(BaseModel):
    name: str

class EventTagCreate(EventTagBase):
    pass

class EventTagDisplay(EventTagBase):
    id: int
    
    class Config:
        model_config = ConfigDict(from_attributes=True)

class EventBase(BaseModel):
    title: str
    description: Optional[str] = None
    start_date: datetime
    end_date: datetime
    location: Optional[str] = None
    format: EventFormatEnum = EventFormatEnum.in_person
    meeting_link: Optional[str] = None
    cover_image: Optional[str] = None
    guest_limit: Optional[int] = None

class EventCreate(EventBase):
    organizer_id: int
    tag_names: Optional[List[str]] = []  # List of tag names to associate

class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    location: Optional[str] = None
    format: Optional[EventFormatEnum] = None
    meeting_link: Optional[str] = None
    cover_image: Optional[str] = None
    guest_limit: Optional[int] = None
    tag_names: Optional[List[str]] = None

class EventDisplay(EventBase):
    id: int
    organizer_id: int
    author: Optional[str] = None  # Organizer's name
    created_at: datetime
    updated_at: datetime
    tags: List[EventTagDisplay] = []
    participant_count: Optional[int] = 0
    rsvp_status: Optional[EventParticipantStatusEnum] = None  # Current user's RSVP status
    
    class Config:
        model_config = ConfigDict(from_attributes=True)

class EventParticipantBase(BaseModel):
    status: EventParticipantStatusEnum = EventParticipantStatusEnum.registered

class EventParticipantCreate(EventParticipantBase):
    user_id: int
    event_id: int

class EventParticipantUpdate(BaseModel):
    status: EventParticipantStatusEnum

class EventParticipantDisplay(EventParticipantBase):
    user_id: int
    event_id: int
    registered_at: datetime
    user_name: Optional[str] = None  # User's display name

    class Config:
        model_config = ConfigDict(from_attributes=True)

class RSVPRequest(BaseModel):
    status: EventParticipantStatusEnum

class RSVPResponse(BaseModel):
    success: bool
    message: str
    status: EventParticipantStatusEnum
    participant_count: int
    is_at_capacity: bool = False

class EventParticipantStats(BaseModel):
    total_participants: int
    going_count: int
    interested_count: int
    registered_count: int
    confirmed_count: int
    status_breakdown: dict = {}

class EventWithRSVPInfo(EventDisplay):
    participant_stats: Optional[EventParticipantStats] = None
    is_organizer: bool = False
    can_manage_attendees: bool = False
    registration_deadline: Optional[datetime] = None
    is_registration_open: bool = True