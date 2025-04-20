from fastapi import FastAPI, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from database import get_db, engine, Base
from models import User
from schemas import UserCreate

app = FastAPI()

# RUTA ZA TEST BAZE
@app.get("/test-db")
async def test_db_connection(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User))
    users = result.scalars().all()
    return {"users": [user.Name for user in users]}

@app.post("/add-user")
async def add_user(user: UserCreate, db: AsyncSession = Depends(get_db)):
    new_user = User(Name=user.Name)
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return {"message": "User added", "user": {"ID": new_user.ID, "Name": new_user.Name}}

@app.on_event("startup")
async def on_startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)