from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from models import User
from sqlalchemy.orm import selectinload

async def get_user_by_id(user_id: int, db: AsyncSession) -> Optional[User]:
    return await db.get(User, user_id)

async def get_user_with_roles_by_id(user_id: int, db: AsyncSession) -> Optional[User]:
    result = await db.execute(
        select(User).options(selectinload(User.roles)).where(User.id == user_id)
    )
    return result.scalars().first()

async def get_all_users(db: AsyncSession) -> List[User]:
    result = await db.execute(select(User))
    return result.scalars().all()

async def get_user_by_email(email: str, db: AsyncSession) -> Optional[User]:
    result = await db.execute(
        select(User).where(User.email == email)
    )
    return result.scalars().first()

async def create_user(user: User, db: AsyncSession) -> User:
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user
