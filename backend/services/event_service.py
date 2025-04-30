from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException

from models import Event, EventParticipant, User
from schemas import EventCreate, EventParticipantDisplay
from repositories import event_repository

async def create_event_service(event_data: EventCreate, db: AsyncSession) -> Event:
    organizer = await db.get(User, event_data.organizer_id)
    if not organizer:
        raise HTTPException(status_code=404, detail="Organizer not found")

    event = Event(**event_data.dict())
    return await event_repository.create_event(event, db)

async def get_event_by_id_service(event_id: int, db: AsyncSession) -> Event:
    event = await event_repository.get_event_by_id(event_id, db)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event

async def get_all_events_service(db: AsyncSession) -> List[Event]:
    return await event_repository.get_all_events(db)

async def get_event_participants_service(event_id: int, db: AsyncSession) -> List[EventParticipant]:
    event = await event_repository.get_event_by_id(event_id, db)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return await event_repository.get_participants_by_event(event_id, db)

async def add_participant_service(event_id: int, participant_data: EventParticipantDisplay, db: AsyncSession) -> EventParticipant:
    user = await db.get(User, participant_data.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    event = await event_repository.get_event_by_id(event_id, db)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    participant = EventParticipant(
        event_id=event_id,
        user_id=participant_data.user_id,
        status=participant_data.status
    )
    return await event_repository.add_participant(participant, db)
