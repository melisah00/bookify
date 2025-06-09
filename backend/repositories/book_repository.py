from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload, joinedload
from sqlalchemy import func

from models import Book, User, Review, book_favourites
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
        select(Review)
        .options(
            joinedload(Review.user).joinedload(User.roles) 
        )
        .where(Review.book_id == book_id)
    )
    return result.unique().scalars().all()

async def get_book_average_rating(book_id: int, db: AsyncSession) -> Optional[float]:
    result = await db.execute(
        select(func.avg(Review.rating)).where(Review.book_id == book_id)
    )
    return result.scalar_one_or_none()


async def get_admin_book_metrics_summary(db: AsyncSession):
    total_books = await db.scalar(select(func.count(Book.id)))

    top_authors_stmt = (
        select(User.id, User.username, func.count(Book.id).label("book_count"))
        .join(Book, Book.author_id == User.id)
        .group_by(User.id)
        .order_by(func.count(Book.id).desc())
        .limit(5)
    )
    top_authors = (await db.execute(top_authors_stmt)).all()

    top_downloaded_stmt = (
        select(Book.id, Book.title, Book.num_of_downloads)
        .order_by(Book.num_of_downloads.desc())
        .limit(5)
    )
    top_downloaded = (await db.execute(top_downloaded_stmt)).all()

    rating_stmt = (
        select(Book.id, Book.title, func.avg(Review.rating), func.count(Review.id))
        .join(Review, Review.book_id == Book.id)
        .group_by(Book.id)
        .having(func.count(Review.id) > 0)
    )
    ratings = (await db.execute(rating_stmt)).all()
    ratings_sorted = sorted(ratings, key=lambda r: r[2] or 0)
    top_rated = ratings_sorted[-5:][::-1]
    bottom_rated = ratings_sorted[:5]

    fav_stmt = (
        select(Book.id, Book.title, func.count().label("favourite_count"))
        .select_from(book_favourites)
        .join(Book, Book.id == book_favourites.c.book_id)
        .group_by(Book.id)
        .order_by(func.count().desc())
        .limit(5)
    )
    favourites = (await db.execute(fav_stmt)).all()

    total_downloads = await db.scalar(select(func.sum(Book.num_of_downloads)))
    total_reviews = await db.scalar(select(func.count(Review.id)))
    avg_global_rating = await db.scalar(select(func.avg(Review.rating)))

    total_favourites = await db.scalar(
        select(func.count()).select_from(book_favourites)
    )

    avg_favourites_per_book = total_favourites / total_books if total_books else 0
    avg_reviews_per_book = total_reviews / total_books if total_books else 0

    return {
        "total_books": total_books,
        "top_authors_by_uploads": [
            {"author_id": a.id, "username": a.username, "book_count": a.book_count}
            for a in top_authors
        ],
        "most_downloaded_books": [
            {"book_id": b.id, "title": b.title, "downloads": b.num_of_downloads}
            for b in top_downloaded
        ],
        "top_rated_books": [
            {"book_id": b[0], "title": b[1], "avg_rating": round(b[2], 2), "reviews": b[3]}
            for b in top_rated
        ],
        "bottom_rated_books": [
            {"book_id": b[0], "title": b[1], "avg_rating": round(b[2], 2), "reviews": b[3]}
            for b in bottom_rated
        ],
        "most_favourited_books": [
            {"book_id": f.id, "title": f.title, "favourites": f.favourite_count}
            for f in favourites
        ],
        "engagement": {
            "total_downloads": total_downloads or 0,
            "total_reviews": total_reviews or 0,
            "avg_global_rating": round(avg_global_rating or 0, 2),
            "avg_favourites_per_book": round(avg_favourites_per_book, 2),
            "avg_reviews_per_book": round(avg_reviews_per_book, 2),
        }
    }