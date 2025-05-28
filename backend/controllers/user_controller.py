from datetime import datetime
from sqlalchemy.future import select 
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from models.user import User
from services.auth_service import get_current_user
from schemas import UserCreate, UserDisplay
from database import get_db, engine
from services import user_service
from sqlalchemy.orm import selectinload
from schemas.user import UserUpdateRequest

router = APIRouter(prefix="/users", tags=["Users"])

def get_session():
    with Session(engine) as session:
        yield session

@router.post("/", response_model=UserDisplay, status_code=201)
async def create_user(user_data: UserCreate, db: Session = Depends(get_session)):
    return await user_service.create_user_service(user_data, db)

@router.get("/", response_model=List[UserDisplay])
async def get_all_users(db: Session = Depends(get_session)):
    return await user_service.get_all_users_service(db)

@router.get("/profile")
async def get_user_profile(
    token_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = int(token_user["id"])
    return await user_service.get_user_profile(user_id, db)


@router.post("/profile")
async def update_user_profile(
    update: UserUpdateRequest,
    token_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = int(token_user["id"])
    return await user_service.update_user_profile(user_id, update, db)
@router.get("/{user_id}", response_model=UserDisplay)
async def get_user(user_id: int, db: Session = Depends(get_session)):
    return await user_service.get_user_by_id_service(user_id, db)
