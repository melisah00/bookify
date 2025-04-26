from passlib.context import CryptContext

from jose import JWTError, jwt
from datetime import datetime, timedelta

from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import selectinload

from database import get_db
from models import Role, RoleNameEnum, User
from schemas import UserCreate
from fastapi.security import OAuth2PasswordBearer


SECRET_KEY =  "secret_key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token") #ovdje mi je stajao login


def hash_password(password: str):
    return pwd_context.hash(password)


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    result = await db.execute(
    select(User)
      .options(selectinload(User.roles))
      .where(User.email == email)
    )
    user: User = result.scalars().first()
    

    if user is None:
        raise credentials_exception
    return user


async def register_user(user_data: UserCreate, db: AsyncSession):
    existing_user = await db.execute(
        select(User).where(
            (User.username == user_data.username) | (User.email == user_data.email)
        )
    )
    if existing_user.scalars().first():
        raise HTTPException(status_code=400, detail="Username or email already registered")

    requested_roles = user_data.roles or [RoleNameEnum.user]
    result = await db.execute(select(Role).where(Role.name.in_(requested_roles)))
    role_objs = result.scalars().all()

    if len(role_objs) != len(requested_roles):
        raise HTTPException(status_code=400, detail="Invalid roles provided")   

    hashed_pw = hash_password(user_data.password)
    new_user = User(
        username=user_data.username,
        email=user_data.email,
        password=hashed_pw,
        roles=role_objs
    )

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    token = create_access_token(data={"sub": new_user.email})
    return {"access_token": token, "token_type": "bearer"}


async def authenticate_user(username: str, password: str, db: AsyncSession):
    result = await db.execute(select(User).where(User.username == username))
    user = result.scalars().first()

    if not user or not verify_password(password, user.password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    token = create_access_token(data={"sub": user.email})
    return {"access_token": token, "token_type": "bearer"}


async def veryfy_token(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Could not validate credentials")
    except JWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")
