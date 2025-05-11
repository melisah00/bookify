from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from schemas import BookCreate, BookDisplay, BookAverageRating, ReviewDisplay
from database import get_db
from services import book_service

router = APIRouter(prefix="/books", tags=["Books"])

@router.post("/", response_model=BookDisplay, status_code=201)
async def create_book(book_data: BookCreate, db: AsyncSession = Depends(get_db)):
    return await book_service.create_book_service(book_data, db)

@router.get("/", response_model=List[BookDisplay])
async def get_all_books(
    genre: Optional[List[str]] = Query(None),
    author: Optional[str] = None,
    keywords: Optional[str] = None,
    sort: Optional[str] = None,
    direction: Optional[str] = "asc",
    db: AsyncSession = Depends(get_db)
):
    return await book_service.get_all_books_service(db, genre, author, keywords, sort, direction)

@router.get("/{book_id}", response_model=BookDisplay)
async def get_book(book_id: int, db: AsyncSession = Depends(get_db)):
    return await book_service.get_book_by_id_service(book_id, db)

@router.get("/{book_id}/reviews", response_model=List[ReviewDisplay])
async def get_reviews(book_id: int, db: AsyncSession = Depends(get_db)):
    return await book_service.get_book_reviews_service(book_id, db)

@router.get("/{book_id}/average-rating", response_model=BookAverageRating)
async def get_average_rating(book_id: int, db: AsyncSession = Depends(get_db)):
    return await book_service.get_book_average_rating_service(book_id, db)
