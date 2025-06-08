# services/auth_service.py
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status, Depends, Cookie
from models import User
from typing import List
from sqlalchemy.orm import selectinload
from database import get_async_db
import os

SECRET_KEY = os.getenv("SECRET_KEY", "changeme")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

bcrypt_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

credentials_exception = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)

# Authenticate a user by comparing hashed password
async def authenticate_user(username: str, password: str, db: AsyncSession):
    stmt = select(User).options(selectinload(User.roles)).filter(User.username == username)
    result = await db.execute(stmt)
    user = result.scalars().first()
    if not user or not bcrypt_context.verify(password, user.password):
        return False
    return user

# Create JWT access token
def create_access_token(username: str, user_id: int, roles: List[str], expires_delta: timedelta):
    payload = {
        "sub": username,
        "id": user_id,
        "roles": roles,
        "exp": datetime.now(timezone.utc) + expires_delta
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

# Extract user info from token stored in cookie
async def get_current_user(token: str = Cookie(default=None)):
    if token is None:
        raise credentials_exception

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        user_id = payload.get("id")
        roles = payload.get("roles", [])

        if username is None or user_id is None:
            raise credentials_exception

        return {"username": username, "id": user_id, "roles": roles}

    except JWTError:
        raise credentials_exception

# Role-based dependency
class RoleChecker:
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    async def __call__(self, current_user: dict = Depends(get_current_user)):
        if not any(role in self.allowed_roles for role in current_user.get("roles", [])):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")
        return current_user

async def get_current_user_for_favourites(
    token: str = Cookie(default=None),
    db: AsyncSession = Depends(get_async_db)
) -> User:
    if not token:
        raise credentials_exception

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("id")
        if not user_id:
            raise credentials_exception

        user = await db.get(User, user_id)
        if not user:
            raise credentials_exception

        return user  # direktan SQLAlchemy model s pristupom favourite_books

    except JWTError:
        raise credentials_exception
    
async def get_current_user_object(
    token: str = Cookie(default=None),
    db: AsyncSession = Depends(get_async_db)
) -> User:
    """Get current user as a User object (not dict)"""
    if not token:
        raise credentials_exception

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("id")
        if not user_id:
            raise credentials_exception

        user = await db.get(User, user_id)
        if not user:
            raise credentials_exception

        return user

    except JWTError:
        raise credentials_exception