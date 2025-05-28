from datetime import datetime
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from schemas.user import UserUpdateRequest
from models import User, Role, RoleNameEnum
from schemas import UserCreate
from repositories import user_repository
from sqlalchemy.orm import selectinload

async def create_user_service(user_data: UserCreate, db: AsyncSession) -> User:
    existing_user = await user_repository.get_user_by_email(user_data.email, db)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )

    user = User(
        username=user_data.username,
        email=user_data.email,
        password=user_data.password
    )

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

async def get_user_profile(user_id: int, db: AsyncSession):
    user = await user_repository.get_user_with_roles_by_id(user_id, db)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "username": user.username,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "email": user.email,
        "date_of_birth": user.date_of_birth,
        "icon": user.icon,
        "roles": [role.name.value for role in user.roles]
    }

async def update_user_profile(user_id: int, update: UserUpdateRequest, db: AsyncSession):
    user = await user_repository.get_user_by_id(user_id, db)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if update.first_name is not None:
        user.first_name = update.first_name
    if update.last_name is not None:
        user.last_name = update.last_name
    if update.email is not None:
        user.email = update.email
    if update.date_of_birth is not None:
        try:
            user.date_of_birth = datetime.strptime(update.date_of_birth, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")

    await db.commit()
    await db.refresh(user)

    return {"message": "Profile updated successfully"}