from fastapi import APIRouter, Depends, Query, Form, status, File, UploadFile, Request
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from sqlalchemy.orm import Session

from schemas import BookCreate, BookDisplay, BookAverageRating, ReviewDisplay
from database import get_db, get_async_db
from services import book_service
from schemas.book import BookResponseSchema
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

    print("📥 [UPLOAD PRIMLJENO]")
    print(f"• title = {title}")
    print(f"• description = {description}")
    print(f"• categories = {categories}")
    print(f"• file.filename = {book_file.filename}")
    print(f"• file.content_type = {book_file.content_type}")
    print(f"• author_id = {author_id} (iz tokena)")

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
            raise HTTPException(status_code=500, detail="Greška prilikom kreiranja knjige.")

        # ✅ Učitaj sve relacije prije serijalizacije
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
            raise HTTPException(status_code=500, detail="Kreirana knjiga nije pronađena.")

        print(f"✅ [USPJEH] Knjiga '{full_book.title}' uspješno kreirana sa ID = {full_book.id}")
        return BookResponseSchema.from_orm(full_book)

    except HTTPException as e:
        print(f"[HTTPException ❗] {e.status_code} - {e.detail}")
        raise e

    except Exception as e:
        print(f"[EXCEPTION ❌] Neočekivana greška: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Došlo je do greške prilikom upload-a knjige."
        )

@router.post("/{book_id}/increment-download")
async def increment_download(book_id: int, db: AsyncSession = Depends(get_async_db)):
    result = await db.execute(select(Book).where(Book.id == book_id))
    book = result.scalar_one_or_none()

    if not book:
        raise HTTPException(status_code=404, detail="Knjiga nije pronađena")

    book.num_of_downloads += 1
    await db.commit()
    await db.refresh(book)
    return {"message": "Download broj je povećan", "num_of_downloads": book.num_of_downloads}