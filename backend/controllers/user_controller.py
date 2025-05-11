from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from schemas import UserCreate, UserDisplay
from database import get_db, engine
from services import user_service

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

@router.get("/{user_id}", response_model=UserDisplay)
async def get_user(user_id: int, db: Session = Depends(get_session)):
    return await user_service.get_user_by_id_service(user_id, db)
