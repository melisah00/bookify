from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from models import Notification

async def create_notification(notification: Notification, db: AsyncSession) -> Notification:
    db.add(notification)
    await db.commit()
    await db.refresh(notification)
    return notification

async def get_notifications_by_user(user_id: int, db: AsyncSession) -> List[Notification]:
    result = await db.execute(
        select(Notification).where(Notification.recipient_id == user_id)
    )
    return result.scalars().all()
