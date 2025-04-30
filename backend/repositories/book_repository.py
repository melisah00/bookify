from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import func

from models import Book, User, Review
from schemas import BookCreate

async def create_book(book_data: BookCreate, db: AsyncSession) -> Optional[Book]:
    author = await db.get(User, book_data.author_id)
    if not author:
        return None

    new_book = Book(
        title=book_data.title,
        path=book_data.path,
        author_id=book_data.author_id
    )

    db.add(new_book)
    await db.commit()
    await db.refresh(new_book)

    result = await db.execute(
        select(Book).where(Book.id == new_book.id).options(
            selectinload(Book.author).selectinload(User.roles)
        )
    )
    return result.scalars().first()

async def get_all_books(db: AsyncSession) -> List[Book]:
    result = await db.execute(
        select(Book).options(
            selectinload(Book.author).selectinload(User.roles)
        )
    )
    return result.scalars().all()

async def get_book_by_id(book_id: int, db: AsyncSession) -> Optional[Book]:
    result = await db.execute(
        select(Book)
        .where(Book.id == book_id)
        .options(
            selectinload(Book.author).selectinload(User.roles)
        )
    )
    return result.scalars().first()

async def get_book_reviews(book_id: int, db: AsyncSession) -> List[Review]:
    result = await db.execute(
        select(Review).where(Review.book_id == book_id)
    )
    return result.scalars().all()

async def get_book_average_rating(book_id: int, db: AsyncSession) -> Optional[float]:
    result = await db.execute(
        select(func.avg(Review.rating)).where(Review.book_id == book_id)
    )
    return result.scalar_one_or_none()
