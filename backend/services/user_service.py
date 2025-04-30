from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from models import User, Role, RoleNameEnum
from schemas import UserCreate
from repositories import user_repository

async def create_user_service(user_data: UserCreate, db: AsyncSession) -> User:
    existing_user = await user_repository.get_user_by_email(user_data.email, db)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )

    # Kreiramo User model iz Pydantic podataka
    user = User(
        username=user_data.username,
        email=user_data.email,
        password=user_data.password  # u realnosti ovde bi išao hash!
    )

    # Dodaj default rolu ako nije data
    if not user_data.roles:
        default_role = await db.execute(
            select(Role).where(Role.name == RoleNameEnum.reader)
        )
        user.roles = [default_role.scalars().first()]
    else:
        roles_query = await db.execute(
            select(Role).where(Role.name.in_(user_data.roles))
        )
        user.roles = roles_query.scalars().all()

    return await user_repository.create_user(user, db)

async def get_user_by_id_service(user_id: int, db: AsyncSession) -> User:
    user = await user_repository.get_user_by_id(user_id, db)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

async def get_all_users_service(db: AsyncSession) -> List[User]:
    return await user_repository.get_all_users(db)
