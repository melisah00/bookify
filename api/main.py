from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel, EmailStr # Potrebno za Pydantic šeme
from typing import List # Potrebno za tipizaciju odgovora

# Import iz vaših lokalnih modula
from database import get_db, engine, Base
# Importujte sve modele ili samo one koje koristite u rutama
from models import *

# --- Pydantic Šeme (obično idu u schemas.py) ---
# Osnovna šema za kreiranje korisnika
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str # U realnoj aplikaciji, lozinka bi se heširala pre čuvanja

# Osnovna šema za prikazivanje korisnika (bez lozinke)
class UserDisplay(BaseModel):
    id: int
    username: str
    email: EmailStr
    first_name: str | None = None
    last_name: str | None = None

    class Config:
        orm_mode = True # Omogućava mapiranje SQLAlchemy modela na Pydantic šemu


# --- FastAPI Aplikacija ---
app = FastAPI(title="Moja Knjiga API", description="API za upravljanje korisnicima i knjigama")

# --- Event Handlers ---
@app.on_event("startup")
async def on_startup():
    """
    Kreiraj sve tabele definisane u Base.metadata prilikom pokretanja aplikacije.
    """
    async with engine.begin() as conn:
        # U produkciji, razmislite o korišćenju Alembic-a za migracije umesto create_all
        # await conn.run_sync(Base.metadata.drop_all) # Obrisati sve tabele (oprezno!)
        await conn.run_sync(Base.metadata.create_all)
    print("Database tables created.")


# --- Rute ---

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
        # Vraćamo listu korisnika formatiranu prema UserDisplay šemi
        return users
    except Exception as e:
        # Uhvatiti potencijalne greške pri konekciji ili upitu
        print(f"Database connection error: {e}")
        raise HTTPException(status_code=500, detail="Database connection error")


@app.post("/add-user", response_model=UserDisplay, status_code=201)
async def add_user(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    """
    Dodaje novog korisnika u bazu podataka.
    Prima podatke definisane u UserCreate šemi.
    Vraća podatke novokreiranog korisnika koristeći UserDisplay šemu.
    """
    # Provera da li korisnik ili email već postoje (opciono, ali preporučljivo)
    existing_user = await db.execute(
        select(User).where(
            (User.username == user_data.username) | (User.email == user_data.email)
        )
    )
    if existing_user.scalars().first():
        raise HTTPException(status_code=400, detail="Username or email already registered")

    # Kreiranje instance User modela
    # !!! Upozorenje: Lozinka se čuva kao čist tekst. Koristite heširanje! !!!
    # Primer sa passlib:
    # from passlib.context import CryptContext
    # pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    # hashed_password = pwd_context.hash(user_data.password)
    # new_user = models.User(username=user_data.username, email=user_data.email, password=hashed_password)

    new_user = User(
        username=user_data.username,
        email=user_data.email,
        password=user_data.password # Direktno čuvanje - NIJE PREPORUČLJIVO
    )

    try:
        db.add(new_user)
        await db.commit()
        await db.refresh(new_user) # Osvežava instancu sa podacima iz baze (npr. ID)
        # Vraćamo podatke korisnika formatirane prema UserDisplay šemi
        return new_user
    except Exception as e:
        # Uhvatiti potencijalne greške pri upisu u bazu
        await db.rollback() # Vratiti transakciju u slučaju greške
        print(f"Error adding user: {e}")
        raise HTTPException(status_code=500, detail="Error adding user to the database")

# Dodajte ovde ostale rute za vaše modele (knjige, kategorije, forume itd.)
# Primer za dodavanje knjige (zahteva definisanje BookCreate i BookDisplay šema)
# @app.post("/books", response_model=BookDisplay, status_code=201)
# async def add_book(book_data: BookCreate, db: AsyncSession = Depends(get_db)):
#     # Logika za dodavanje knjige...
#     pass

# Možete pokrenuti server komandom: uvicorn main:app --reload
