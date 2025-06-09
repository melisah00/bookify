from fastapi import APIRouter, Depends, Query, Form, status, File, UploadFile, Request, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from sqlalchemy.orm import Session, selectinload
from sqlalchemy.future import select

from schemas import BookCreate, BookDisplay, BookAverageRating, ReviewDisplay
from database import get_db, get_async_db
from services import book_service
from schemas.book import AdminBookMetricsSummary, BookAnalytics, BookResponseSchema
from services.auth_service import *
from services.book_service import *

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

@router.get("/authored", response_model=list[BookAnalytics])
async def get_authored_books(
    db: AsyncSession = Depends(get_async_db),
    token_user: dict = Depends(get_current_user)
):
    result = await db.execute(
        select(Book)
        .options(selectinload(Book.author).selectinload(User.roles))
        .where(Book.author_id == token_user["id"])
    )
    books = result.scalars().all()

    enriched = []
    for book in books:
        avg = await get_average_book_rating(book.id, db)
        reviews = await get_review_count(book.id, db)
        favs = await get_favourite_count(book.id, db)

        enriched.append(BookAnalytics(
        id=book.id,
        title=book.title,
        num_of_downloads=book.num_of_downloads,
        average_rating=avg,
        review_count=reviews,
        favourite_count=favs
    ))

    return enriched

@router.get("/favourites")
async def get_favourites(
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user_for_favourites)
):
    result = await db.execute(
        select(User).options(selectinload(User.favourite_books)).where(User.id == current_user.id)
    )
    user = result.scalar_one()
    return [book.id for book in user.favourite_books]

@router.post("/favourites/{book_id}")
async def add_to_favourites(
    book_id: int,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user_for_favourites)
):
    result = await db.execute(
        select(User).options(selectinload(User.favourite_books)).where(User.id == current_user.id)
    )
    user = result.scalar_one()

    book_result = await db.execute(select(Book).where(Book.id == book_id))
    book = book_result.scalar_one_or_none()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    if any(b.id == book_id for b in user.favourite_books):
        return {"detail": "Book already in favourites"}

    user.favourite_books.append(book)
    await db.commit()
    return {"detail": "Book added to favourites"}

@router.delete("/favourites/{book_id}")
async def remove_from_favourites(
    book_id: int,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user_for_favourites)
):
    result = await db.execute(
        select(User).options(selectinload(User.favourite_books)).where(User.id == current_user.id)
    )
    user = result.scalar_one()

    book_result = await db.execute(select(Book).where(Book.id == book_id))
    book = book_result.scalar_one_or_none()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    if not any(b.id == book_id for b in user.favourite_books):
        raise HTTPException(status_code=400, detail="Book not in favourites")

    user.favourite_books = [b for b in user.favourite_books if b.id != book_id]
    await db.commit()
    return {"detail": "Book removed from favourites"}

@router.get("/{book_id}", response_model=BookDisplay)
async def get_book(book_id: int, db: AsyncSession = Depends(get_db)):
    return await book_service.get_book_by_id_service(book_id, db)

@router.get("/{book_id}/reviews", response_model=List[ReviewDisplay])
async def get_reviews(book_id: int, db: AsyncSession = Depends(get_db)):
    return await book_service.get_book_reviews_service(book_id, db)

@router.get("/{book_id}/average-rating", response_model=BookAverageRating)
async def get_average_rating(book_id: int, db: AsyncSession = Depends(get_db)):
    return await book_service.get_book_average_rating_service(book_id, db)

@router.post(
    "/testZaUpload",
    response_model=BookResponseSchema,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(RoleChecker(["author"]))]
)
async def api_create_book_with_upload(
    request: Request,
    title: str = Form(...),
    description: Optional[str] = Form(None),
    book_file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    form = await request.form()
    categories = form.getlist("categories")
    author_id = current_user['id']

    try:
        new_book = await service_create_book_with_upload(
            title=title,
            description=description,
            categories_data=categories,
            book_file=book_file,
            author_id=author_id,
            db=db
        )

        if not new_book:
            raise HTTPException(status_code=500, detail="Error while creating book.")

        result = await db.execute(
            select(Book)
            .where(Book.id == new_book.id)
            .options(
                selectinload(Book.categories),
                selectinload(Book.author)
            )
        )
        full_book = result.scalar_one_or_none()

        if not full_book:
            raise HTTPException(status_code=500, detail="Created book not found.")

        print(f"✅ [SUCCESS] Book '{full_book.title}' successfully created with ID = {full_book.id}")
        return BookResponseSchema.from_orm(full_book)

    except HTTPException as e:
        print(f"[HTTPException ❗] {e.status_code} - {e.detail}")
        raise e

    except Exception as e:
        print(f"[EXCEPTION ❌] Unexpected error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during book upload."
        )

@router.post("/{book_id}/increment-download")
async def increment_download(book_id: int, db: AsyncSession = Depends(get_async_db)):
    result = await db.execute(select(Book).where(Book.id == book_id))
    book = result.scalar_one_or_none()

    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    book.num_of_downloads += 1
    await db.commit()
    await db.refresh(book)
    return {"message": "Download count incremented", "num_of_downloads": book.num_of_downloads}

@router.get("/{book_id}/review-stats")
async def get_review_stats(book_id: int, db: AsyncSession = Depends(get_async_db)):
    stmt = (
        select(
            func.date_trunc("day", Review.created_at).label("date"),
            func.count().label("count")
        )
        .where(Review.book_id == book_id)
        .group_by("date")
        .order_by("date")
    )
    result = await db.execute(stmt)
    rows = result.all()

    return [{"date": row.date.date().isoformat(), "count": row.count} for row in rows]

@router.get("/authored/summary")
async def get_book_summary(
    db: AsyncSession = Depends(get_async_db),
    token_user: dict = Depends(get_current_user)
):
    author_id = token_user["id"]

    result = await db.execute(select(Book).where(Book.author_id == author_id))
    books = result.scalars().all()

    summaries = []
    for book in books:
        review_count = await db.scalar(
            select(func.count(Review.id)).where(Review.book_id == book.id)
        )
        favourite_count = await db.scalar(
            select(func.count()).select_from(book_favourites).where(book_favourites.c.book_id == book.id)
        )

        summaries.append({
            "id": book.id,
            "title": book.title,
            "num_of_downloads": book.num_of_downloads or 0,
            "review_count": review_count or 0,
            "favourite_count": favourite_count or 0,
        })

    return summaries

@router.get("/admin/metrics/summary", response_model=AdminBookMetricsSummary)
async def get_admin_metrics_summary(db: AsyncSession = Depends(get_async_db)):
    return await book_service.get_admin_metrics_summary_service(db)