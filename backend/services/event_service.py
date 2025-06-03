from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException

from models.event import Event, EventParticipant, EventTag
from models.user import User
from schemas.event import EventCreate, EventUpdate, EventParticipantCreate, EventParticipantUpdate
from repositories import event_repository

async def create_event_service(event_data: EventCreate, db: AsyncSession) -> Event:
    # Verify organizer exists
    organizer = await db.get(User, event_data.organizer_id)
    if not organizer:
        raise HTTPException(status_code=404, detail="Organizer not found")
    
    # Create event
    event_dict = event_data.model_dump(exclude={'tag_names'})
    event = Event(**event_dict)
    
    # Handle tags
    if event_data.tag_names:
        for tag_name in event_data.tag_names:
            tag = await event_repository.get_or_create_tag(tag_name, db)
            event.tags.append(tag)
    
    return await event_repository.create_event(event, db)

async def get_event_by_id_service(event_id: int, db: AsyncSession, user_id: Optional[int] = None) -> Event:
    event = await event_repository.get_event_by_id(event_id, db, user_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Add computed fields
    event.author = event.organizer.username if event.organizer else None
    event.participant_count = len(event.participants) if event.participants else 0
    
    return event

async def get_all_events_service(db: AsyncSession, skip: int = 0, limit: int = 100,
                                user_id: Optional[int] = None, filters: Optional[dict] = None) -> List[Event]:
    events = await event_repository.get_all_events(db, skip, limit, user_id, filters)
    
    # Add computed fields for each event
    for event in events:
        event.author = event.organizer.username if event.organizer else None
        event.participant_count = len(event.participants) if event.participants else 0
    
    return events

async def update_event_service(event_id: int, event_data: EventUpdate, db: AsyncSession) -> Event:
    # Get existing event
    existing_event = await event_repository.get_event_by_id(event_id, db)
    if not existing_event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Update basic fields
    update_dict = event_data.model_dump(exclude_unset=True, exclude={'tag_names'})
    
    # Handle tags if provided
    if event_data.tag_names is not None:
        # Clear existing tags
        existing_event.tags.clear()
        
        # Add new tags
        for tag_name in event_data.tag_names:
            tag = await event_repository.get_or_create_tag(tag_name, db)
            existing_event.tags.append(tag)
    
    updated_event = await event_repository.update_event(event_id, update_dict, db)
    
    # Add computed fields
    updated_event.author = updated_event.organizer.username if updated_event.organizer else None
    updated_event.participant_count = len(updated_event.participants) if updated_event.participants else 0
    
    return updated_event

async def delete_event_service(event_id: int, db: AsyncSession) -> bool:
    event = await event_repository.get_event_by_id(event_id, db)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    return await event_repository.delete_event(event_id, db)

async def get_event_participants_service(event_id: int, db: AsyncSession) -> List[EventParticipant]:
    event = await event_repository.get_event_by_id(event_id, db)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    participants = await event_repository.get_participants_by_event(event_id, db)
    
    # Add computed fields
    for participant in participants:
        participant.user_name = participant.user.username if participant.user else None
    
    return participants

async def add_participant_service(event_id: int, participant_data: EventParticipantCreate, db: AsyncSession) -> EventParticipant:
    # Verify user exists
    user = await db.get(User, participant_data.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Verify event exists
    event = await event_repository.get_event_by_id(event_id, db)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Check guest limit
    if event.guest_limit and len(event.participants) >= event.guest_limit:
        raise HTTPException(status_code=400, detail="Event is at capacity")
    
    participant = EventParticipant(
        event_id=event_id,
        user_id=participant_data.user_id,
        status=participant_data.status
    )
    
    result = await event_repository.add_participant(participant, db)
    result.user_name = user.username
    
    return result

async def update_participant_service(event_id: int, user_id: int, participant_data: EventParticipantUpdate, db: AsyncSession) -> EventParticipant:
    # Verify event exists
    event = await event_repository.get_event_by_id(event_id, db)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Create participant with updated status
    participant = EventParticipant(
        event_id=event_id,
        user_id=user_id,
        status=participant_data.status
    )
    
    return await event_repository.add_participant(participant, db)

async def remove_participant_service(event_id: int, user_id: int, db: AsyncSession) -> bool:
    # Verify event exists
    event = await event_repository.get_event_by_id(event_id, db)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    return await event_repository.remove_participant(event_id, user_id, db)