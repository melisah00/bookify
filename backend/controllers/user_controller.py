from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from schemas import UserCreate, UserDisplay
from database import get_db
from services import user_service

router = APIRouter(prefix="/users", tags=["Users"])

@router.post("/", response_model=UserDisplay, status_code=201)
async def create_user(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    return await user_service.create_user_service(user_data, db)

@router.get("/", response_model=List[UserDisplay])
async def get_all_users(db: AsyncSession = Depends(get_db)):
    return await user_service.get_all_users_service(db)

@router.get("/{user_id}", response_model=UserDisplay)
async def get_user(user_id: int, db: AsyncSession = Depends(get_db)):
    return await user_service.get_user_by_id_service(user_id, db)
