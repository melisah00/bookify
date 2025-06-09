from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from database import get_db
from schemas import ReviewCreate, ReviewDisplay
from services import review_service

router = APIRouter(prefix="/reviews", tags=["Reviews"])

@router.post("/{book_id}", response_model=ReviewDisplay, status_code=status.HTTP_201_CREATED)
async def create_review(book_id: int, review_data: ReviewCreate, db: AsyncSession = Depends(get_db)):
    return await review_service.create_review_service(book_id, review_data, db)

@router.get("/by-book/{book_id}", response_model=List[ReviewDisplay])
async def get_reviews_by_book(book_id: int, db: AsyncSession = Depends(get_db)):
    return await review_service.get_reviews_by_book_service(book_id, db)

@router.get("/by-user/{user_id}", response_model=List[ReviewDisplay])
async def get_reviews_by_user(user_id: int, db: AsyncSession = Depends(get_db)):
    return await review_service.get_reviews_by_user_service(user_id, db)
