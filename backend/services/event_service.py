from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException

from models.event import Event, EventParticipant, EventTag, EventParticipantStatusEnum
from models.user import User, RoleNameEnum
from schemas.event import EventCreate, EventUpdate, EventParticipantCreate, EventParticipantUpdate, RSVPResponse, EventParticipantStats

from repositories import event_repository

try:
    from services.email_service import email_service
    EMAIL_AVAILABLE = True
except ImportError as e:
    print(f"Email service not available: {e}")
    EMAIL_AVAILABLE = False
    email_service = None

    if status in [EventParticipantStatusEnum.registered, EventParticipantStatusEnum.confirmed]:
        if EMAIL_AVAILABLE and email_service:
            try:
                user_name = f"{user.first_name} {user.last_name}".strip() or user.username
                event_details = {
                    'id': event.id,
                    'start_date': event.start_date.strftime('%B %d, %Y at %I:%M %p') if event.start_date else 'TBD',
                    'location': event.location,
                    'format': event.format.value if event.format else 'TBD',
                    'meeting_link': event.meeting_link
                }
                
                email_service.send_event_registration_confirmation(
                    user.email,
                    user_name,
                    event.title,
                    event_details
                )
            except Exception as e:
                # Log error but don't fail the registration
                print(f"Failed to send confirmation email: {e}")
        else:
            print(f"Email confirmation for {user.email}: Registration for '{event.title}' confirmed")
from services.notification_service import create_notification_service

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

async def check_event_ownership(event_id: int, user_id: int, db: AsyncSession) -> bool:
    """Check if user is the owner of the event or has admin privileges"""
    event = await event_repository.get_event_by_id(event_id, db)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Check if user is the organizer
    if event.organizer_id == user_id:
        return True
    
    # Check if user has admin role
    user = await db.get(User, user_id)
    if user and user.roles:
        admin_roles = [RoleNameEnum.admin, RoleNameEnum.forum_admin]
        if any(role.name in admin_roles for role in user.roles):
            return True
    
    return False

async def update_event_service(event_id: int, event_data: EventUpdate, user_id: int, db: AsyncSession) -> Event:
    # Check ownership
    if not await check_event_ownership(event_id, user_id, db):
        raise HTTPException(status_code=403, detail="Not authorized to edit this event")
    
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
    
    # Notify participants about event update
    for participant in updated_event.participants:
        await create_notification_service(
            f"Event '{updated_event.title}' has been updated by the organizer.",
            participant.user_id,
            db
        )
    
    return updated_event

async def delete_event_service(event_id: int, user_id: int, db: AsyncSession) -> bool:
    # Check ownership
    if not await check_event_ownership(event_id, user_id, db):
        raise HTTPException(status_code=403, detail="Not authorized to delete this event")
    
    event = await event_repository.get_event_by_id(event_id, db)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Notify participants about event cancellation
    for participant in event.participants:
        await create_notification_service(
            f"Event '{event.title}' has been cancelled by the organizer.",
            participant.user_id,
            db
        )
    
    return await event_repository.delete_event(event_id, db)

async def get_events_by_organizer_service(organizer_id: int, db: AsyncSession) -> List[Event]:
    """Get all events organized by a specific user"""
    events = await event_repository.get_events_by_organizer(organizer_id, db)
    
    # Add computed fields
    for event in events:
        event.author = event.organizer.username if event.organizer else None
        event.participant_count = len(event.participants) if event.participants else 0
    
    return events

async def get_user_registered_events_service(user_id: int, db: AsyncSession) -> List[Event]:
    """Get all events the user is registered for"""
    events = await event_repository.get_events_by_participant(user_id, db)
    
    # Add computed fields and RSVP status
    for event in events:
        event.author = event.organizer.username if event.organizer else None
        event.participant_count = len(event.participants) if event.participants else 0
        
        # Find user's RSVP status
        user_participant = next(
            (p for p in event.participants if p.user_id == user_id), None
        )
        if user_participant:
            event.rsvp_status = user_participant.status
    
    return events

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

async def rsvp_to_event_service(
    event_id: int, 
    user_id: int, 
    status: EventParticipantStatusEnum, 
    db: AsyncSession
) -> RSVPResponse:
    """Handle RSVP to an event with email confirmation"""
    # Verify user exists
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Verify event exists
    event = await event_repository.get_event_by_id(event_id, db)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Check if user is the organizer
    if event.organizer_id == user_id:
        raise HTTPException(status_code=400, detail="Organizers cannot RSVP to their own events")
    
    # Check guest limit for 'going' and 'registered' statuses
    if status in [EventParticipantStatusEnum.going, EventParticipantStatusEnum.registered]:
        confirmed_count = len([p for p in event.participants if p.status in [
            EventParticipantStatusEnum.going, 
            EventParticipantStatusEnum.registered,
            EventParticipantStatusEnum.confirmed
        ]])
        
        if event.guest_limit and confirmed_count >= event.guest_limit:
            # Check if user is already registered (allow status updates)
            existing_participant = next(
                (p for p in event.participants if p.user_id == user_id), None
            )
            if not existing_participant or existing_participant.status not in [
                EventParticipantStatusEnum.going, 
                EventParticipantStatusEnum.registered,
                EventParticipantStatusEnum.confirmed
            ]:
                return RSVPResponse(
                    success=False,
                    message="Event is at capacity",
                    status=status,
                    participant_count=confirmed_count,
                    is_at_capacity=True
                )
    
    # Create or update participant
    participant = EventParticipant(
        event_id=event_id,
        user_id=user_id,
        status=status
    )
    
    await event_repository.add_participant(participant, db)
    
    # Send email confirmation for confirmed registrations
    if status in [EventParticipantStatusEnum.registered, EventParticipantStatusEnum.confirmed]:
        try:
            user_name = f"{user.first_name} {user.last_name}".strip() or user.username
            event_details = {
                'id': event.id,
                'start_date': event.start_date.strftime('%B %d, %Y at %I:%M %p') if event.start_date else 'TBD',
                'location': event.location,
                'format': event.format.value if event.format else 'TBD',
                'meeting_link': event.meeting_link
            }
            
            email_service.send_event_registration_confirmation(
                user.email,
                user_name,
                event.title,
                event_details
            )
        except Exception as e:
            # Log error but don't fail the registration
            print(f"Failed to send confirmation email: {e}")
    
    # Get updated participant count
    updated_event = await event_repository.get_event_by_id(event_id, db)
    participant_count = len([p for p in updated_event.participants if p.status in [
        EventParticipantStatusEnum.going, 
        EventParticipantStatusEnum.registered,
        EventParticipantStatusEnum.confirmed
    ]])
    
    return RSVPResponse(
        success=True,
        message=f"Successfully updated RSVP status to {status.value}",
        status=status,
        participant_count=participant_count,
        is_at_capacity=event.guest_limit and participant_count >= event.guest_limit
    )

async def get_user_rsvp_status_service(event_id: int, user_id: int, db: AsyncSession):
    """Get user's current RSVP status for an event"""
    participant = await event_repository.get_participant_by_user_and_event(event_id, user_id, db)
    
    if participant:
        return {
            "status": participant.status,
            "registered_at": participant.registered_at,
            "has_rsvp": True
        }
    else:
        return {
            "status": None,
            "registered_at": None,
            "has_rsvp": False
        }

async def get_event_participant_stats_service(event_id: int, db: AsyncSession) -> EventParticipantStats:
    """Get participant statistics for an event"""
    event = await event_repository.get_event_by_id(event_id, db)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    participants = event.participants
    total_participants = len(participants)
    
    # Count by status
    status_counts = {}
    for status in EventParticipantStatusEnum:
        status_counts[status.value] = len([p for p in participants if p.status == status])
    
    return EventParticipantStats(
        total_participants=total_participants,
        going_count=status_counts.get('going', 0),
        interested_count=status_counts.get('interested', 0),
        registered_count=status_counts.get('registered', 0),
        confirmed_count=status_counts.get('confirmed', 0),
        status_breakdown=status_counts
    )

async def get_event_attendees_service(
    event_id: int, 
    status: Optional[EventParticipantStatusEnum], 
    organizer_id: Optional[int], 
    db: AsyncSession
):
    """Get detailed attendee list for organizers"""
    event = await event_repository.get_event_by_id(event_id, db)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Check if user is organizer or admin
    if organizer_id and event.organizer_id != organizer_id:
        # TODO: Add admin role check here
        raise HTTPException(status_code=403, detail="Not authorized to view attendee details")
    
    participants = await event_repository.get_participants_by_event(event_id, db)
    
    # Filter by status if provided
    if status:
        participants = [p for p in participants if p.status == status]
    
    # Add computed fields
    for participant in participants:
        participant.user_name = participant.user.username if participant.user else None
        participant.user_email = participant.user.email if participant.user else None
        participant.user_full_name = f"{participant.user.first_name} {participant.user.last_name}".strip() if participant.user and participant.user.first_name else None
    
    return participants

async def bulk_update_attendees_service(
    event_id: int, 
    updates: List[dict], 
    organizer_id: int, 
    db: AsyncSession
):
    """Bulk update attendee statuses"""
    event = await event_repository.get_event_by_id(event_id, db)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Check if user is organizer
    if event.organizer_id != organizer_id:
        raise HTTPException(status_code=403, detail="Not authorized to manage attendees")
    
    updated_count = 0
    errors = []
    
    for update in updates:
        try:
            user_id = update.get('user_id')
            new_status = EventParticipantStatusEnum(update.get('status'))
            
            participant = EventParticipant(
                event_id=event_id,
                user_id=user_id,
                status=new_status
            )
            
            await event_repository.add_participant(participant, db)
            updated_count += 1
            
        except Exception as e:
            errors.append(f"Failed to update user {update.get('user_id')}: {str(e)}")
    
    return {
        "updated_count": updated_count,
        "total_requested": len(updates),
        "errors": errors
    }