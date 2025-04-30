from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from models import Book, User, Review
from schemas import ReviewCreate
from repositories import review_repository

async def create_review_service(book_id: int, review_data: ReviewCreate, db: AsyncSession) -> Review:
    book = await db.get(Book, book_id)
    if not book:
        raise HTTPException(status_code=404, detail=f"Book with ID {book_id} not found")

    user = await db.get(User, review_data.user_id)
    if not user:
        raise HTTPException(status_code=404, detail=f"User with ID {review_data.user_id} not found")

    existing = await review_repository.check_existing_review(book_id, review_data.user_id, db)
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"User {review_data.user_id} has already reviewed book {book_id}"
        )

    return await review_repository.create_review(
        book_id=book_id,
        user_id=review_data.user_id,
        rating=review_data.rating,
        comment=review_data.comment,
        db=db
    )

async def get_reviews_by_book_service(book_id: int, db: AsyncSession) -> List[Review]:
    book = await db.get(Book, book_id)
    if not book:
        raise HTTPException(status_code=404, detail=f"Book with ID {book_id} not found")
    return await review_repository.get_reviews_by_book(book_id, db)

async def get_reviews_by_user_service(user_id: int, db: AsyncSession) -> List[Review]:
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail=f"User with ID {user_id} not found")
    return await review_repository.get_reviews_by_user(user_id, db)
