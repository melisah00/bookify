from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from database import get_db
from schemas.event import (
    EventCreate, EventUpdate, EventDisplay, 
    EventParticipantCreate, EventParticipantUpdate, EventParticipantDisplay,
    EventTagDisplay
)
from services import event_service

router = APIRouter(prefix="/events", tags=["Events"])

@router.post("/", response_model=EventDisplay, status_code=201)
async def create_event(event_data: EventCreate, db: AsyncSession = Depends(get_db)):
    """Create a new event"""
    return await event_service.create_event_service(event_data, db)

@router.get("/", response_model=List[EventDisplay])
async def get_all_events(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    tag: Optional[str] = Query(None),
    format: Optional[str] = Query(None),
    author: Optional[str] = Query(None),
    user_id: Optional[int] = Query(None),  # For RSVP status
    db: AsyncSession = Depends(get_db)
):
    """Get all events with optional filtering"""
    filters = {}
    if tag:
        filters['tag'] = tag
    if format:
        filters['format'] = format
    if author:
        filters['author'] = author
    
    return await event_service.get_all_events_service(db, skip, limit, user_id, filters)

@router.get("/{event_id}", response_model=EventDisplay)
async def get_event(
    event_id: int, 
    user_id: Optional[int] = Query(None),  # For RSVP status
    db: AsyncSession = Depends(get_db)
):
    """Get a specific event by ID"""
    return await event_service.get_event_by_id_service(event_id, db, user_id)

@router.put("/{event_id}", response_model=EventDisplay)
async def update_event(event_id: int, event_data: EventUpdate, db: AsyncSession = Depends(get_db)):
    """Update an existing event"""
    return await event_service.update_event_service(event_id, event_data, db)

@router.delete("/{event_id}")
async def delete_event(event_id: int, db: AsyncSession = Depends(get_db)):
    """Delete an event"""
    success = await event_service.delete_event_service(event_id, db)
    if success:
        return {"message": "Event deleted successfully"}
    else:
        raise HTTPException(status_code=404, detail="Event not found")

@router.get("/{event_id}/participants", response_model=List[EventParticipantDisplay])
async def get_event_participants(event_id: int, db: AsyncSession = Depends(get_db)):
    """Get all participants for a specific event"""
    return await event_service.get_event_participants_service(event_id, db)

@router.post("/{event_id}/participants", response_model=EventParticipantDisplay)
async def add_participant(event_id: int, participant_data: EventParticipantCreate, db: AsyncSession = Depends(get_db)):
    """Add a participant to an event"""
    return await event_service.add_participant_service(event_id, participant_data, db)

@router.put("/{event_id}/participants/{user_id}", response_model=EventParticipantDisplay)
async def update_participant(
    event_id: int, 
    user_id: int, 
    participant_data: EventParticipantUpdate, 
    db: AsyncSession = Depends(get_db)
):
    """Update a participant's status for an event"""
    return await event_service.update_participant_service(event_id, user_id, participant_data, db)

@router.delete("/{event_id}/participants/{user_id}")
async def remove_participant(event_id: int, user_id: int, db: AsyncSession = Depends(get_db)):
    """Remove a participant from an event"""
    success = await event_service.remove_participant_service(event_id, user_id, db)
    if success:
        return {"message": "Participant removed successfully"}
    else:
        raise HTTPException(status_code=404, detail="Participant not found")

# Calendar feed endpoint (for iCal export)
@router.get("/calendar/feed.ics")
async def get_calendar_feed(db: AsyncSession = Depends(get_db)):
    """Generate iCal feed for all events"""
    events = await event_service.get_all_events_service(db, 0, 1000)
    
    # Simple iCal generation (you might want to use a proper library like icalendar)
    ical_content = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Bookify//Events//EN\n"
    
    for event in events:
        ical_content += f"""BEGIN:VEVENT
UID:{event.id}@bookify.com
DTSTART:{event.start_date.strftime('%Y%m%dT%H%M%SZ')}
DTEND:{event.end_date.strftime('%Y%m%dT%H%M%SZ')}
SUMMARY:{event.title}
DESCRIPTION:{event.description or ''}
LOCATION:{event.location or ''}
END:VEVENT
"""
    
    ical_content += "END:VCALENDAR"
    
    return Response(content=ical_content, media_type="text/calendar")