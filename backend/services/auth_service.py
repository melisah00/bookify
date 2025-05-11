from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from passlib.context import CryptContext
from models import User
from datetime import datetime, timedelta, timezone
import os
from typing import Annotated, List
from fastapi import Depends, HTTPException, status
from jose import JWTError, jwt
from fastapi.security import OAuth2PasswordBearer
from database import get_db
from sqlalchemy.orm import selectinload

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")

# Set up password hashing and OAuth2Bearer for token extraction
bcrypt_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_bearer = OAuth2PasswordBearer(tokenUrl="auth/token")
credentials_exception = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)

# Initialize the password hashing context
bcrypt_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Authenticate a user by comparing the hashed password
async def authenticate_user(username: str, password: str, db: AsyncSession):
    stmt = (
        select(User)
        .options(selectinload(User.roles)) 
        .filter(User.username == username)
    )
    result = await db.execute(stmt)
    user = result.scalars().first()
    if not user:
        return False
    if not bcrypt_context.verify(password, user.password):
        return False
    return user

# Create a JWT access token with a configurable expiry
def create_access_token(username: str, user_id: int, roles: list[str], expires_delta: timedelta):
    payload = {"sub": username, "id": user_id, "roles": roles}
    expires = datetime.now(timezone.utc) + expires_delta
    payload.update({"exp": expires})
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

# Utility function/dependency to get the current user from the token
async def get_current_user(token: Annotated[str, Depends(oauth2_bearer)]):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        user_id: int = payload.get("id")
        user_roles: list[str] = payload.get("roles")
        if username is None or user_id is None:
            raise credentials_exception
        return {"username": username, "id": user_id, "roles": user_roles}
    except JWTError:
        raise credentials_exception
    
class RoleChecker:
    def __init__(self, allowed_roles: list[str]):
        self.allowed_roles = allowed_roles
    
    async def __call__(self, current_user: dict = Depends(get_current_user)):
        user_roles = current_user.get("roles", [])
        if not any(role in self.allowed_roles for role in user_roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
        return current_user
    

