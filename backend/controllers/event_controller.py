from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from database import get_db
from schemas import EventCreate, EventDisplay, EventParticipantDisplay
from services import event_service

router = APIRouter(prefix="/events", tags=["Events"])

@router.post("/", response_model=EventDisplay, status_code=201)
async def create_event(event_data: EventCreate, db: AsyncSession = Depends(get_db)):
    return await event_service.create_event_service(event_data, db)

@router.get("/", response_model=List[EventDisplay])
async def get_all_events(db: AsyncSession = Depends(get_db)):
    return await event_service.get_all_events_service(db)

@router.get("/{event_id}", response_model=EventDisplay)
async def get_event(event_id: int, db: AsyncSession = Depends(get_db)):
    return await event_service.get_event_by_id_service(event_id, db)

@router.get("/{event_id}/participants", response_model=List[EventParticipantDisplay])
async def get_event_participants(event_id: int, db: AsyncSession = Depends(get_db)):
    return await event_service.get_event_participants_service(event_id, db)

@router.post("/{event_id}/participants", response_model=EventParticipantDisplay)
async def add_participant(event_id: int, participant_data: EventParticipantDisplay, db: AsyncSession = Depends(get_db)):
    return await event_service.add_participant_service(event_id, participant_data, db)
