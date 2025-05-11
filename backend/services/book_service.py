from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from schemas import BookCreate, BookAverageRating
from models import Book, Review, Category, User, CategoryEnum
from repositories import book_repository
from sqlalchemy.orm import selectinload, joinedload
from sqlalchemy import select, or_

async def create_book_service(book_data: BookCreate, db: AsyncSession) -> Book:
    book = await book_repository.create_book(book_data, db)
    if not book:
        raise HTTPException(status_code=404, detail=f"Author with ID {book_data.author_id} not found")
    return book

async def get_all_books_service(
    db: AsyncSession,
    genre: Optional[List[str]] = None,
    author: Optional[str] = None,
    keywords: Optional[str] = None,
    sort: Optional[str] = None,
    direction: Optional[str] = "asc"
) -> List[Book]:
    stmt = (
        select(Book)
        .options(
            joinedload(Book.author).selectinload(User.roles),
            selectinload(Book.categories)
        )
    )

    if genre:
        try:
            enum_values = [CategoryEnum(g) for g in genre]
            stmt = stmt.join(Book.categories).where(Category.category.in_(enum_values))
        except ValueError:
    
            stmt = stmt.where(False)

    if author:
        stmt = stmt.join(Book.author).where(User.username.ilike(f"%{author}%"))

    if keywords:
        stmt = stmt.where(
            or_(
                Book.title.ilike(f"%{keywords}%"),
                Book.path.ilike(f"%{keywords}%")
            )
        )

    if sort == "title":
        stmt = stmt.order_by(Book.title.asc() if direction == "asc" else Book.title.desc())
    elif sort == "downloads":
        stmt = stmt.order_by(Book.num_of_downloads.asc() if direction == "asc" else Book.num_of_downloads.desc())
    elif sort == "author":
        if "users" not in str(stmt):
            stmt = stmt.join(Book.author)
        stmt = stmt.order_by(User.username.asc() if direction == "asc" else User.username.desc())

    result = await db.execute(stmt)
    return result.scalars().unique().all()

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
