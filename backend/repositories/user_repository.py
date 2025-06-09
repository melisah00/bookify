from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from models import User
from sqlalchemy.orm import selectinload

async def get_user_by_id(user_id: int, db: AsyncSession) -> Optional[User]:
    stmt = select(User).where(User.id == user_id).options(selectinload(User.roles))
    result = await db.execute(stmt)
    user = result.scalars().first()
    return user
    
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


async def get_users_paginated(db: AsyncSession, offset: int, limit: int):
    stmt = (
        select(User)
        .options(selectinload(User.roles))  # ✅ preload roles
        .offset(offset)
        .limit(limit)
    )
    result = await db.execute(stmt)
    return result.scalars().all()