import os
import shutil
import uuid

from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status, UploadFile

from schemas import BookCreate, BookAverageRating
from models import Book, Review, Category, User, CategoryEnum
from repositories import book_repository
from sqlalchemy.orm import selectinload, joinedload
from sqlalchemy import func, select, or_
from models import book_favourites 

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
    avg_rating_subq = (
        select(
            Review.book_id,
            func.avg(Review.rating).label("average_rating"),
            func.count(Review.id).label("review_count")
        )
        .group_by(Review.book_id)
        .subquery()
    )

    stmt = (
        select(Book)
        .options(
            joinedload(Book.author).selectinload(User.roles),
            selectinload(Book.categories)
        )
        .join(avg_rating_subq, Book.id == avg_rating_subq.c.book_id, isouter=True)
        .add_columns(
            avg_rating_subq.c.average_rating,
            avg_rating_subq.c.review_count
        )
    )

    # apply filters...
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
    rows = result.all()

    # manually assign rating data to each book object
    books = []
    for book, avg_rating, review_count in rows:
        book.average_rating = avg_rating
        book.review_count = review_count
        books.append(book)

    return books

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

async def create_book_in_db(
    book_data: BookCreate,
    db: AsyncSession,
    category_names: Optional[List[str]] = None
) -> Optional[Book]:
    print(f"[DB] Pokušaj pronalaska autora ID: {book_data.author_id}")
    author = await db.get(User, book_data.author_id)
    if not author:
        print(f"[DB ERROR] Autor nije pronađen.")
        return None

    new_book = Book(
        title=book_data.title,
        path=book_data.path,
        author_id=book_data.author_id,
        description=book_data.description
    )

    # ✅ Obradi kategorije prije flush/add
    if category_names:
        for cat_name in category_names:
            try:
                cat_enum = CategoryEnum(cat_name)  # Validiraj
                stmt = select(Category).where(Category.category == cat_enum)
                result = await db.execute(stmt)
                category_obj = result.scalar_one_or_none()

                if not category_obj:
                    category_obj = Category(category=cat_enum)
                    db.add(category_obj)
                    await db.flush()  # ⚠️ flush samo za kategoriju

                new_book.categories.append(category_obj)
            except ValueError:
                print(f"[DB WARNING] '{cat_name}' nije validna kategorija.")
                continue

    db.add(new_book)            # ✅ Tek sad dodaj knjigu
    await db.flush()            # ✅ Sad flush
    await db.commit()
    await db.refresh(new_book)
    print(f"[DB] Nova knjiga dodana u bazu: {new_book}")
    return new_book


UPLOAD_DIRECTORY = "book_files"
# Kreiraj direktorij ako ne postoji
os.makedirs(UPLOAD_DIRECTORY, exist_ok=True)

async def service_create_book_with_upload(
    title: str,
    description: Optional[str],
    categories_data: Optional[List[str]],
    book_file: UploadFile,
    author_id: int,
    db: AsyncSession
) -> Book:
    if book_file.content_type != "application/pdf":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nevažeći tip fajla. Dozvoljeni su samo PDF fajlovi."
        )

    try:
        file_extension = os.path.splitext(book_file.filename)[1] or ".pdf"
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_location_on_server = os.path.join(UPLOAD_DIRECTORY, unique_filename)

        with open(file_location_on_server, "wb+") as file_object:
            shutil.copyfileobj(book_file.file, file_object)

        db_file_path = f"/book_files/{unique_filename}"

    except IOError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Greška prilikom čuvanja fajla."
        )
    finally:
        if book_file and hasattr(book_file, 'file') and book_file.file:
            book_file.file.close()

    book_data_for_db = BookCreate(
        title=title,
        path=db_file_path,
        author_id=author_id,
        description=description
    )

    created_book = await create_book_in_db(book_data_for_db, db, categories_data)

    if not created_book:
        if os.path.exists(file_location_on_server):
            os.remove(file_location_on_server)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Autor sa ID {author_id} nije pronađen ili je došlo do greške prilikom kreiranja knjige."
        )

    return created_book

async def get_average_book_rating(book_id: int, db: AsyncSession) -> float | None:
    stmt = select(func.avg(Review.rating)).where(Review.book_id == book_id)
    result = await db.execute(stmt)
    avg = result.scalar_one_or_none()
    return float(avg) if avg is not None else None

async def get_review_count(book_id: int, db: AsyncSession) -> int:
    result = await db.execute(
        select(func.count(Review.id)).where(Review.book_id == book_id)
    )
    return result.scalar()

async def get_favourite_count(book_id: int, db: AsyncSession) -> int:
    result = await db.execute(
        select(func.count()).select_from(book_favourites).where(book_favourites.c.book_id == book_id)
    )
    return result.scalar()

async def get_admin_metrics_summary_service(db: AsyncSession):
    return await book_repository.get_admin_book_metrics_summary(db)