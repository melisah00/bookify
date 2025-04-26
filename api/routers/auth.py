from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends, APIRouter
from services.auth import authenticate_user
from services.auth import register_user
from services.auth import  get_current_user
from services.auth import veryfy_token
from database import get_db
from models import  User
from schemas import UserCreate
from fastapi.security import OAuth2PasswordRequestForm


router = APIRouter()


@router.post("/register", status_code=201)
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    return await register_user(user_data, db)


@router.post("/token")
async def token(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    return await authenticate_user(form_data.username, form_data.password, db)


@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return {
        "username": current_user.username,
        "email": current_user.email,
        "roles": [
            {"id": role.id, "name": role.name.value}  # ili .name ako već string
            for role in current_user.roles
        ]
    }



@router.get("/verify-token/{token}")
async def verify_token(token: str):
    veryfy_token(token=token)
    return {"message": "Token is valid"}