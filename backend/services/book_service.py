from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from schemas import BookCreate, BookAverageRating
from models import Book, Review
from repositories import book_repository

async def create_book_service(book_data: BookCreate, db: AsyncSession) -> Book:
    book = await book_repository.create_book(book_data, db)
    if not book:
        raise HTTPException(status_code=404, detail=f"Author with ID {book_data.author_id} not found")
    return book

async def get_all_books_service(db: AsyncSession) -> List[Book]:
    return await book_repository.get_all_books(db)

async def get_book_by_id_service(book_id: int, db: AsyncSession) -> Book:
    book = await book_repository.get_book_by_id(book_id, db)
    if not book:
        raise HTTPException(status_code=404, detail=f"Book with ID {book_id} not found")
    return book

async def get_book_reviews_service(book_id: int, db: AsyncSession) -> List[Review]:
    book = await book_repository.get_book_by_id(book_id, db)
    if not book:
        raise HTTPException(status_code=404, detail=f"Book with ID {book_id} not found")
    return await book_repository.get_book_reviews(book_id, db)

async def get_book_average_rating_service(book_id: int, db: AsyncSession) -> BookAverageRating:
    book = await book_repository.get_book_by_id(book_id, db)
    if not book:
        raise HTTPException(status_code=404, detail=f"Book with ID {book_id} not found")

    avg = await book_repository.get_book_average_rating(book_id, db)
    return BookAverageRating(book_id=book_id, average_rating=avg)
