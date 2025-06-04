from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from models.user import User
from models import Review
from sqlalchemy.orm import selectinload



async def get_reviews_by_book(book_id: int, db: AsyncSession) -> List[Review]:
    result = await db.execute(
        select(Review).where(Review.book_id == book_id)
    )
    return result.scalars().all()

async def get_reviews_by_user(user_id: int, db: AsyncSession) -> List[Review]:
    result = await db.execute(
        select(Review).where(Review.user_id == user_id)
    )
    return result.scalars().all()

async def check_existing_review(book_id: int, user_id: int, db: AsyncSession) -> Optional[Review]:
    result = await db.execute(
        select(Review).where(
            (Review.book_id == book_id) &
            (Review.user_id == user_id)
        )
    )
    return result.scalars().first()

async def create_review(book_id: int, user_id: int, rating: int, comment: Optional[str], db: AsyncSession) -> Review:
    new_review = Review(
        rating=rating,
        comment=comment,
        book_id=book_id,
        user_id=user_id
    )

    db.add(new_review)
    await db.commit()
    await db.refresh(new_review)

    result = await db.execute(
        select(Review)
        .where(Review.id == new_review.id)
        .options(
            selectinload(Review.user).selectinload(User.roles) 
        )
    )
    return result.scalar_one()