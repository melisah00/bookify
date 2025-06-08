from fastapi import APIRouter, Depends, Query, HTTPException, Response
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from database import get_db
from schemas.event import (
    EventCreate, EventUpdate, EventDisplay, 
    EventParticipantCreate, EventParticipantUpdate, EventParticipantDisplay,
    EventTagDisplay, RSVPRequest, RSVPResponse, EventParticipantStats
)
from models.event import EventParticipantStatusEnum
from forum_service import event_service
from forum_service.event_analytics_service import analytics_service
from forum_service.ical_service import ical_service
from forum_service.auth_service import get_current_user, get_current_user_object
from models.user import User

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

@router.get("/my-events", response_model=List[EventDisplay])
async def get_my_events(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_object)
):
    """Get all events organized by the current user"""
    return await event_service.get_events_by_organizer_service(current_user.id, db)

@router.get("/my-registrations", response_model=List[EventDisplay])
async def get_my_registrations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_object)
):
    """Get all events the current user is registered for"""
    return await event_service.get_user_registered_events_service(current_user.id, db)

@router.get("/{event_id}", response_model=EventDisplay)
async def get_event(
    event_id: int, 
    user_id: Optional[int] = Query(None),  # For RSVP status
    db: AsyncSession = Depends(get_db)
):
    """Get a specific event by ID"""
    return await event_service.get_event_by_id_service(event_id, db, user_id)

@router.put("/{event_id}", response_model=EventDisplay)
async def update_event(
    event_id: int, 
    event_data: EventUpdate, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_object)  # Changed this line
):
    """Update an existing event (only by organizer or admin)"""
    return await event_service.update_event_service(event_id, event_data, current_user.id, db)

@router.delete("/{event_id}")
async def delete_event(
    event_id: int, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_object)
):
    """Delete an event (only by organizer or admin)"""
    success = await event_service.delete_event_service(event_id, current_user.id, db)
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

# NEW RSVP ENDPOINTS

@router.post("/{event_id}/rsvp", response_model=RSVPResponse)
async def rsvp_to_event(
    event_id: int, 
    rsvp_data: RSVPRequest,
    user_id: int = Query(..., description="User ID for RSVP"),
    db: AsyncSession = Depends(get_db)
):
    """RSVP to an event with the specified status"""
    return await event_service.rsvp_to_event_service(event_id, user_id, rsvp_data.status, db)

@router.get("/{event_id}/rsvp-status")
async def get_user_rsvp_status(
    event_id: int,
    user_id: int = Query(..., description="User ID to check RSVP status"),
    db: AsyncSession = Depends(get_db)
):
    """Get the current user's RSVP status for an event"""
    return await event_service.get_user_rsvp_status_service(event_id, user_id, db)

@router.get("/{event_id}/stats", response_model=EventParticipantStats)
async def get_event_participant_stats(event_id: int, db: AsyncSession = Depends(get_db)):
    """Get participant statistics for an event"""
    return await event_service.get_event_participant_stats_service(event_id, db)

@router.get("/{event_id}/attendees")
async def get_event_attendees(
    event_id: int,
    status: Optional[EventParticipantStatusEnum] = Query(None, description="Filter by status"),
    organizer_id: Optional[int] = Query(None, description="Organizer ID for access control"),
    db: AsyncSession = Depends(get_db)
):
    """Get detailed attendee list (for organizers)"""
    return await event_service.get_event_attendees_service(event_id, status, organizer_id, db)

@router.post("/{event_id}/bulk-update-attendees")
async def bulk_update_attendees(
    event_id: int,
    updates: List[dict],  # [{"user_id": int, "status": EventParticipantStatusEnum}]
    organizer_id: int = Query(..., description="Organizer ID for access control"),
    db: AsyncSession = Depends(get_db)
):
    """Bulk update attendee statuses (for organizers)"""
    return await event_service.bulk_update_attendees_service(event_id, updates, organizer_id, db)

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

@router.get("/analytics/organizer", response_model=dict)
async def get_organizer_analytics(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_object)
):
    """Get comprehensive analytics for the current organizer"""
    return await analytics_service.get_organizer_analytics(current_user.id, db)

@router.get("/{event_id}/analytics", response_model=dict)
async def get_event_analytics(
    event_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_object)
):
    """Get detailed analytics for a specific event"""
    return await analytics_service.get_event_detailed_analytics(event_id, current_user.id, db)

@router.get("/{event_id}/export/{format}")
async def export_event_data(
    event_id: int,
    format: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_object)
):
    """Export event data in various formats (csv, json)"""
    try:
        data = await analytics_service.export_event_data(event_id, current_user.id, format, db)
        
        if format.lower() == 'csv':
            return Response(
                content=data,
                media_type="text/csv",
                headers={"Content-Disposition": f"attachment; filename=event_{event_id}_participants.csv"}
            )
        elif format.lower() == 'json':
            return Response(
                content=data,
                media_type="application/json",
                headers={"Content-Disposition": f"attachment; filename=event_{event_id}_data.json"}
            )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{event_id}/ical")
async def download_event_ical(
    event_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Download iCal file for a specific event"""
    event = await event_service.get_event_by_id_service(event_id, db)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    ical_content = ical_service.generate_event_ical(event)
    
    return Response(
        content=ical_content,
        media_type="text/calendar",
        headers={
            "Content-Disposition": f"attachment; filename={event.title.replace(' ', '_')}.ics"
        }
    )

@router.get("/calendar/my-events.ics")
async def download_my_events_calendar(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_object)
):
    """Download iCal file for all organizer's events"""
    events = await event_service.get_events_by_organizer_service(current_user.id, db)
    
    ical_content = ical_service.generate_calendar_feed(events, f"{current_user.username}'s Events")
    
    return Response(
        content=ical_content,
        media_type="text/calendar",
        headers={
            "Content-Disposition": f"attachment; filename={current_user.username}_events.ics"
        }
    )

@router.get("/calendar/my-registrations.ics")
async def download_my_registrations_calendar(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_object)
):
    """Download iCal file for all user's registered events"""
    events = await event_service.get_user_registered_events_service(current_user.id, db)
    
    ical_content = ical_service.generate_calendar_feed(events, f"{current_user.username}'s Registered Events")
    
    return Response(
        content=ical_content,
        media_type="text/calendar",
        headers={
            "Content-Disposition": f"attachment; filename={current_user.username}_registered_events.ics"
        }
    )