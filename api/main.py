from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel, EmailStr 
from typing import List 
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload


from database import get_db, engine, Base

from models import *
from schemas import *

app = FastAPI(title="Bookify", description="API za upravljanje korisnicima i knjigama")

origins = [
    "http://localhost:3000", # Adresa tvog React development servera
    # Dodaj druge potrebne origin-e
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"], # Dozvoli sve metode (GET, POST, etc.)
    allow_headers=["*"], # Dozvoli sve headere
)


# --- Event Handlers ---
@app.on_event("startup")
async def on_startup():
    """
    Kreiraj sve tabele definisane u Base.metadata prilikom pokretanja aplikacije.
    """
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Database tables created.")


@app.get("/")
async def read_root():
    """
    Osnovna ruta za proveru da li API radi.
    """
    return {"message": "Dobrodošli na Moj Knjiga API!"}


@app.get("/test-db", response_model=List[UserDisplay])
async def test_db_connection(db: AsyncSession = Depends(get_db)):
    """
    Testira konekciju sa bazom podataka tako što dohvati sve korisnike.
    Vraća listu korisnika koristeći UserDisplay šemu.
    """
    try:
        result = await db.execute(select(User))
        users = result.scalars().all()
        return users
    except Exception as e:
        print(f"Database connection error: {e}")
        raise HTTPException(status_code=500, detail="Database connection error")


@app.post("/add-user", response_model=UserDisplay, status_code=201)
async def add_user(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    """
    Dodaje novog korisnika u bazu podataka.
    Prima podatke definisane u UserCreate šemi.
    Vraća podatke novokreiranog korisnika koristeći UserDisplay šemu.
    """
    existing_user = await db.execute(
        select(User).where(
            (User.username == user_data.username) | (User.email == user_data.email)
        )
    )
    if existing_user.scalars().first():
        raise HTTPException(status_code=400, detail="Username or email already registered")

    new_user = User(
        username=user_data.username,
        email=user_data.email,
        password=user_data.password 
    )

    try:
        db.add(new_user)
        await db.commit()
        await db.refresh(new_user) # Osvežava instancu sa podacima iz baze (npr. ID)
        return new_user
    except Exception as e:
        await db.rollback() 
        print(f"Error adding user: {e}")
        raise HTTPException(status_code=500, detail="Error adding user to the database")

@app.post("/books", response_model=BookDisplay, status_code=201)
async def add_book(book_data: BookCreate, db: AsyncSession = Depends(get_db)):
    """
    Dodaje novu knjigu u bazu podataka.
    Prima podatke definisane u BookCreate šemi.
    Vraća podatke novokreirane knjige koristeći BookDisplay šemu.
    """
    author_result = await db.execute(select(User).where(User.id == book_data.author_id))
    author = author_result.scalars().first()
    if not author:
        raise HTTPException(status_code=404, detail=f"Author with ID {book_data.author_id} not found")

    new_book = Book(
        title=book_data.title,
        path=book_data.path,
        author_id=book_data.author_id
        # num_of_downloads će imati default vrednost 0 iz modela
    )

    try:
        db.add(new_book)
        await db.commit()
        await db.refresh(new_book) 
        return new_book
    except Exception as e:
        await db.rollback()  
        print(f"Error adding book: {e}")
        raise HTTPException(status_code=500, detail="Error adding book to the database")
    
@app.post("/reviews/{book_id}", response_model=ReviewDisplay, status_code=status.HTTP_201_CREATED) 
async def create_review(
    book_id: int,
    review_data: ReviewCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Dodaje novu recenziju za knjigu.
    Prima podatke definisane u ReviewCreate šemi osim book_id (uzima se iz URL-a).
    Vraća podatke novokreirane recenzije koristeći ReviewDisplay šemu.
    """
    book = await db.get(Book, book_id)
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Book with ID {book_id} not found"
        )

    user = await db.get(User, review_data.user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {review_data.user_id} not found"
        )

    existing_review_result = await db.execute(
        select(Review).where(
            (Review.book_id == book_id) & 
            (Review.user_id == review_data.user_id)
        )
    )
    if existing_review_result.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User {review_data.user_id} has already reviewed book {book_id}"
        )

    new_review = Review(
        rating=review_data.rating,
        comment=review_data.comment,
        book_id=book_id,
        user_id=review_data.user_id
    )

    try:
        db.add(new_review)
        await db.commit()
        await db.refresh(new_review)
        return new_review
    except Exception as e:
        await db.rollback()
        print(f"Error adding review: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error adding review to the database"
        )


@app.get("/books/{book_id}/reviews", response_model=List[ReviewDisplay])
async def get_reviews_for_book(book_id: int, db: AsyncSession = Depends(get_db)):
    """
    Dohvata sve recenzije za određenu knjigu.
    """

    book = await db.get(Book, book_id)
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Book with ID {book_id} not found"
        )

    result = await db.execute(
        select(Review).where(Review.book_id == book_id)
    )
    reviews = result.scalars().all()
    return reviews

@app.get("/users/{user_id}/reviews", response_model=List[ReviewDisplay])
async def get_reviews_by_user(user_id: int, db: AsyncSession = Depends(get_db)):
    """
    Dohvata sve recenzije koje je ostavio određeni korisnik.
    """
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found"
        )

    result = await db.execute(
        select(Review).where(Review.user_id == user_id)
    )
    reviews = result.scalars().all()
    return reviews

@app.get("/books/{book_id}/average-rating", response_model=BookAverageRating)
async def get_book_average_rating(
    book_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Dohvata prosečnu ocenu za određenu knjigu na osnovu svih njenih recenzija.
    """
    book = await db.get(Book, book_id)
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Book with ID {book_id} not found"
        )

    query = select(
        func.avg(Review.rating).label("average_rating") 
    ).where(
        Review.book_id == book_id 
    )

    result = await db.execute(query)
    average_rating = result.scalar_one_or_none() 

    return BookAverageRating(book_id=book_id, average_rating=average_rating)

@app.get("/books", response_model=List[BookDisplay])
async def get_all_books(db: AsyncSession = Depends(get_db)):
    """
    Vraća listu svih knjiga sa osnovnim informacijama i autorom.
    """
    result = await db.execute(
        select(Book).options(selectinload(Book.author))
    )
    books = result.scalars().all()
    return books

@app.get("/books/{book_id}", response_model=BookDisplay)
async def get_book_details(book_id: int, db: AsyncSession = Depends(get_db)):
    """
    Vraća detalje za specifičnu knjigu na osnovu ID-ja.
    """
    book = await db.get(Book, book_id, options=[selectinload(Book.author)]) 
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Book with ID {book_id} not found"
        )
    return book