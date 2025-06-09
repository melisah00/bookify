from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from models import Notification, User
from schemas import NotificationDisplay
from repositories import notification_repository

async def create_notification_service(message: str, recipient_id: int, db: AsyncSession) -> Notification:
    user = await db.get(User, recipient_id)
    if not user:
        raise HTTPException(status_code=404, detail="Recipient not found")

    notification = Notification(
        message=message,
        recipient_id=recipient_id
    )

    return await notification_repository.create_notification(notification, db)

async def get_user_notifications_service(user_id: int, db: AsyncSession) -> List[Notification]:
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return await notification_repository.get_notifications_by_user(user_id, db)
