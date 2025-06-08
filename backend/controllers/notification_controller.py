from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from database import get_db
from schemas import NotificationDisplay
from forum_service import notification_service

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.post("/", response_model=NotificationDisplay)
async def create_notification(
    message: str,
    recipient_id: int,
    db: AsyncSession = Depends(get_db)
):
    return await notification_service.create_notification_service(message, recipient_id, db)

@router.get("/user/{user_id}", response_model=List[NotificationDisplay])
async def get_notifications_for_user(user_id: int, db: AsyncSession = Depends(get_db)):
    return await notification_service.get_user_notifications_service(user_id, db)
