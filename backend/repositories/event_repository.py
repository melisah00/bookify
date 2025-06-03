from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy import select, func, and_
from models.event import Event, EventParticipant, EventTag
from models.user import User

async def create_event(event: Event, db: AsyncSession) -> Event:
    db.add(event)
    await db.commit()
    await db.refresh(event)
    
    # Eagerly load the tags relationship for the response
    query = select(Event).options(
        selectinload(Event.organizer),
        selectinload(Event.tags),
        selectinload(Event.participants)
    ).where(Event.id == event.id)
    
    result = await db.execute(query)
    refreshed_event = result.scalar_one()
    
    return refreshed_event

async def get_event_by_id(event_id: int, db: AsyncSession, user_id: Optional[int] = None) -> Optional[Event]:
    query = select(Event).options(
        selectinload(Event.organizer),
        selectinload(Event.tags),
        selectinload(Event.participants).selectinload(EventParticipant.user)
    ).where(Event.id == event_id)
    
    result = await db.execute(query)
    event = result.scalar_one_or_none()
    
    if event and user_id:
        # Add current user's RSVP status
        participant_query = select(EventParticipant).where(
            and_(EventParticipant.event_id == event_id, EventParticipant.user_id == user_id)
        )
        participant_result = await db.execute(participant_query)
        participant = participant_result.scalar_one_or_none()
        if participant:
            event.rsvp_status = participant.status
    
    return event

async def get_all_events(db: AsyncSession, skip: int = 0, limit: int = 100, 
                        user_id: Optional[int] = None, filters: Optional[dict] = None) -> List[Event]:
    query = select(Event).options(
        selectinload(Event.organizer),
        selectinload(Event.tags),
        selectinload(Event.participants)
    )
    
    # Apply filters
    if filters:
        if filters.get('tag'):
            query = query.join(Event.tags).where(EventTag.name == filters['tag'])
        if filters.get('format'):
            query = query.where(Event.format == filters['format'])
        if filters.get('author'):
            query = query.join(Event.organizer).where(User.username.ilike(f"%{filters['author']}%"))
    
    query = query.offset(skip).limit(limit).order_by(Event.start_date)
    result = await db.execute(query)
    events = result.scalars().all()
    
    # Add RSVP status for current user if provided
    if user_id and events:
        event_ids = [event.id for event in events]
        participant_query = select(EventParticipant).where(
            and_(EventParticipant.event_id.in_(event_ids), EventParticipant.user_id == user_id)
        )
        participant_result = await db.execute(participant_query)
        participants = participant_result.scalars().all()
        
        # Create a mapping of event_id to participant status
        participant_map = {p.event_id: p.status for p in participants}
        
        # Add RSVP status to events
        for event in events:
            event.rsvp_status = participant_map.get(event.id)
    
    return events

async def update_event(event_id: int, event_data: dict, db: AsyncSession) -> Optional[Event]:
    query = select(Event).where(Event.id == event_id)
    result = await db.execute(query)
    event = result.scalar_one_or_none()
    
    if event:
        for key, value in event_data.items():
            if hasattr(event, key) and value is not None:
                setattr(event, key, value)
        
        await db.commit()
        await db.refresh(event)
    
    return event

async def delete_event(event_id: int, db: AsyncSession) -> bool:
    query = select(Event).where(Event.id == event_id)
    result = await db.execute(query)
    event = result.scalar_one_or_none()
    
    if event:
        await db.delete(event)
        await db.commit()
        return True
    
    return False

async def get_participants_by_event(event_id: int, db: AsyncSession) -> List[EventParticipant]:
    query = select(EventParticipant).options(
        selectinload(EventParticipant.user)
    ).where(EventParticipant.event_id == event_id)
    
    result = await db.execute(query)
    return result.scalars().all()

async def add_participant(participant: EventParticipant, db: AsyncSession) -> EventParticipant:
    # Check if participant already exists
    existing_query = select(EventParticipant).where(
        and_(EventParticipant.event_id == participant.event_id, 
             EventParticipant.user_id == participant.user_id)
    )
    existing_result = await db.execute(existing_query)
    existing_participant = existing_result.scalar_one_or_none()
    
    if existing_participant:
        # Update existing participant status
        existing_participant.status = participant.status
        await db.commit()
        await db.refresh(existing_participant)
        return existing_participant
    else:
        # Create new participant
        db.add(participant)
        await db.commit()
        await db.refresh(participant)
        return participant

async def remove_participant(event_id: int, user_id: int, db: AsyncSession) -> bool:
    query = select(EventParticipant).where(
        and_(EventParticipant.event_id == event_id, EventParticipant.user_id == user_id)
    )
    result = await db.execute(query)
    participant = result.scalar_one_or_none()
    
    if participant:
        await db.delete(participant)
        await db.commit()
        return True
    
    return False

async def get_or_create_tag(tag_name: str, db: AsyncSession) -> EventTag:
    query = select(EventTag).where(EventTag.name == tag_name.lower())
    result = await db.execute(query)
    tag = result.scalar_one_or_none()
    
    if not tag:
        tag = EventTag(name=tag_name.lower())
        db.add(tag)
        await db.commit()
        await db.refresh(tag)
    
    return tag

async def get_event_count(db: AsyncSession) -> int:
    query = select(func.count(Event.id))
    result = await db.execute(query)
    return result.scalar()