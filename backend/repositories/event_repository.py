from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy import select, func, and_, desc
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

async def get_or_create_tag(tag_name: str, db: AsyncSession) -> EventTag:
    # First try to get existing tag
    query = select(EventTag).where(EventTag.name == tag_name)
    result = await db.execute(query)
    tag = result.scalar_one_or_none()
    
    if tag:
        return tag
    
    # Create new tag if it doesn't exist
    new_tag = EventTag(name=tag_name)
    db.add(new_tag)
    await db.commit()
    await db.refresh(new_tag)
    
    return new_tag

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

async def get_participant_by_user_and_event(event_id: int, user_id: int, db: AsyncSession) -> Optional[EventParticipant]:
    query = select(EventParticipant).where(
        and_(EventParticipant.event_id == event_id, EventParticipant.user_id == user_id)
    )
    result = await db.execute(query)
    return result.scalar_one_or_none()

async def get_events_by_organizer(organizer_id: int, db: AsyncSession) -> List[Event]:
    """Get all events organized by a specific user"""
    query = select(Event).options(
        selectinload(Event.organizer),
        selectinload(Event.tags),
        selectinload(Event.participants).selectinload(EventParticipant.user)
    ).where(Event.organizer_id == organizer_id).order_by(desc(Event.start_date))
    
    result = await db.execute(query)
    return result.scalars().all()

async def get_events_by_participant(user_id: int, db: AsyncSession) -> List[Event]:
    """Get all events where user is a participant"""
    query = select(Event).options(
        selectinload(Event.organizer),
        selectinload(Event.tags),
        selectinload(Event.participants).selectinload(EventParticipant.user)
    ).join(Event.participants).where(EventParticipant.user_id == user_id).order_by(desc(Event.start_date))
    
    result = await db.execute(query)
    return result.scalars().all()

async def update_event(event_id: int, update_data: dict, db: AsyncSession) -> Event:
    """Update an event with new data"""
    event = await db.get(Event, event_id)
    if not event:
        return None
    
    for field, value in update_data.items():
        if hasattr(event, field):
            setattr(event, field, value)
    
    await db.commit()
    await db.refresh(event)
    
    # Reload with relationships
    query = select(Event).options(
        selectinload(Event.organizer),
        selectinload(Event.tags),
        selectinload(Event.participants).selectinload(EventParticipant.user)
    ).where(Event.id == event_id)
    
    result = await db.execute(query)
    return result.scalar_one()

async def delete_event(event_id: int, db: AsyncSession) -> bool:
    """Delete an event"""
    event = await db.get(Event, event_id)
    if not event:
        return False
    
    await db.delete(event)
    await db.commit()
    return True