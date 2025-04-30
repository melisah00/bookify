import enum
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, ForeignKey, Enum,
    PrimaryKeyConstraint, Text, func
)
from sqlalchemy.orm import relationship
from database import Base

# Enum za status učesnika
class EventParticipantStatusEnum(enum.Enum):
    registered = "registered"
    confirmed = "confirmed"
    cancelled = "cancelled"
    attended = "attended"

class Event(Base):
    __tablename__ = "event"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    event_date = Column(DateTime(timezone=True), nullable=False)
    location = Column(String, nullable=True)
    is_online = Column(Boolean, default=False)
    meeting_link = Column(String, nullable=True)
    guest_limit = Column(Integer, nullable=True)
    organizer_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    organizer = relationship("User", back_populates="events_organized")
    participants = relationship("EventParticipant", back_populates="event")

class EventParticipant(Base):
    __tablename__ = "event_participant"

    id = Column(Integer, primary_key=True, index=True)
    registered_at = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(Enum(EventParticipantStatusEnum), default=EventParticipantStatusEnum.registered)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    event_id = Column(Integer, ForeignKey("event.id"), nullable=False)

    __table_args__ = (
        PrimaryKeyConstraint("user_id", "event_id", name="pk_event_participant"),
    )

    user = relationship("User", back_populates="event_participations")
    event = relationship("Event", back_populates="participants")
