import enum
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, ForeignKey, Enum,
    PrimaryKeyConstraint, Text, func, Table
)
from sqlalchemy.orm import relationship
from database import Base

# Enum for participant status
class EventParticipantStatusEnum(enum.Enum):
    going = "going"
    interested = "interested" 
    not_going = "not_going"
    registered = "registered"
    confirmed = "confirmed"
    cancelled = "cancelled"
    attended = "attended"

# Enum for event format
class EventFormatEnum(enum.Enum):
    in_person = "in-person"
    virtual = "virtual"
    hybrid = "hybrid"

# Association table for event tags (many-to-many)
event_tags = Table(
    'event_tags',
    Base.metadata,
    Column('event_id', Integer, ForeignKey('event.id'), primary_key=True),
    Column('tag_id', Integer, ForeignKey('event_tag.id'), primary_key=True)
)

class EventTag(Base):
    __tablename__ = "event_tag"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    
    # Many-to-many relationship with events
    events = relationship("Event", secondary=event_tags, back_populates="tags")

class Event(Base):
    __tablename__ = "event"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    start_date = Column(DateTime(timezone=True), nullable=False)
    end_date = Column(DateTime(timezone=True), nullable=False)
    location = Column(String, nullable=True)
    format = Column(Enum(EventFormatEnum), default=EventFormatEnum.in_person)
    meeting_link = Column(String, nullable=True)
    cover_image = Column(String, nullable=True)  # URL to cover image
    guest_limit = Column(Integer, nullable=True)
    organizer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    organizer = relationship("User", back_populates="events_organized")
    participants = relationship("EventParticipant", back_populates="event", cascade="all, delete-orphan")
    tags = relationship("EventTag", secondary=event_tags, back_populates="events")

class EventParticipant(Base):
    __tablename__ = "event_participant"

    registered_at = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(Enum(EventParticipantStatusEnum), default=EventParticipantStatusEnum.registered)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    event_id = Column(Integer, ForeignKey("event.id"), nullable=False)

    __table_args__ = (
        PrimaryKeyConstraint("user_id", "event_id", name="pk_event_participant"),
    )

    user = relationship("User", back_populates="event_participations")
    event = relationship("Event", back_populates="participants")