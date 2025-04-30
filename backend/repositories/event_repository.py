from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from models import Event, EventParticipant

async def create_event(event: Event, db: AsyncSession) -> Event:
    db.add(event)
    await db.commit()
    await db.refresh(event)
    return event

async def get_event_by_id(event_id: int, db: AsyncSession) -> Optional[Event]:
    return await db.get(Event, event_id)

async def get_all_events(db: AsyncSession) -> List[Event]:
    result = await db.execute(select(Event))
    return result.scalars().all()

async def get_participants_by_event(event_id: int, db: AsyncSession) -> List[EventParticipant]:
    result = await db.execute(
        select(EventParticipant).where(EventParticipant.event_id == event_id)
    )
    return result.scalars().all()

async def add_participant(participant: EventParticipant, db: AsyncSession) -> EventParticipant:
    db.add(participant)
    await db.commit()
    await db.refresh(participant)
    return participant
