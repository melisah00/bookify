from datetime import datetime, timedelta, timezone
from urllib import response
from sqlalchemy import select
from models.user import Role, RoleNameEnum
from models.dto_auth_model import Token
from services.auth_service import authenticate_user, create_access_token
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Annotated
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from jose import jwt, JWTError
import models.dto_auth_model as dto_auth_model
from services.auth_service import authenticate_user, create_access_token, bcrypt_context, oauth2_bearer, credentials_exception
import os
from services.auth_service import get_current_user
from fastapi import Response
from services.auth_service import RoleChecker
# Adjust these imports to match your project structure
from models import User
from database import get_db

router = APIRouter(
    prefix="/auth",
    tags=["auth"]
)

db_dependency = Annotated[AsyncSession, Depends(get_db)]

# Route to render the login page (if required)
@router.get("/login-page")
async def render_login_page(request: Request):
    # TODO: Implement login page
    pass

# Route to render the register page (if required)
@router.get("/register-page")
async def render_register_page(request: Request):
    # TODO: Implement register page
    pass

# Endpoint for user registration
@router.post("/register", status_code=status.HTTP_201_CREATED)
async def create_user(create_user_request: dto_auth_model.CreateUserRequest, db: AsyncSession = Depends(get_db)):
    
    existing_user = await db.execute(select(User).filter(User.username == create_user_request.username))
    if existing_user.scalars().first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username already exists. Please choose another username.")
    
    existing_email = await db.execute(select(User).filter(User.email == create_user_request.email))
    if existing_email.scalars().first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already exists. Please choose another email.")
    
    new_user = User(
        username=create_user_request.username,
        email=create_user_request.email,
        first_name=create_user_request.first_name,
        last_name=create_user_request.last_name,
        password=bcrypt_context.hash(create_user_request.password),
        icon=create_user_request.icon,
        date_of_birth=create_user_request.date_of_birth,
        age=create_user_request.age
    )
    
    reader_role_result = await db.execute(select(Role).filter(Role.name == RoleNameEnum.reader))
    reader_role = reader_role_result.scalars().first()
    
    if not reader_role:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="System error: Reader role not found")
    
    new_user.roles.append(reader_role)
    
    db.add(new_user)
    try:
        await db.commit()
        await db.refresh(new_user)
        await db.refresh(new_user, attribute_names=['roles'])
        return {
            "id": new_user.id,
            "username": new_user.username,
            "email": new_user.email,
            "first_name": new_user.first_name,
            "last_name": new_user.last_name,
            "icon": new_user.icon,
            "roles": [role.name.value for role in new_user.roles] if new_user.roles else []
        }
    except Exception as e: 
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while creating the account."
        )

# Endpoint for user login which returns a JWT token upon successful authentication
@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: Annotated[OAuth2PasswordRequestForm, Depends()], db: AsyncSession = Depends(get_db)):
    user = await authenticate_user(form_data.username, form_data.password, db)
    if not user:
        raise credentials_exception
    user_roles = [role.name.value for role in user.roles] if user.roles else []
    
    access_token = create_access_token(
        username=user.username, 
        user_id=user.id, 
        roles=user_roles, 
        expires_delta=timedelta(minutes=20)
    )
    return {"access_token": access_token, "token_type": "Bearer"}


@router.get("/admin-only-route", dependencies=[Depends(RoleChecker(allowed_roles=["admin"]))])
async def admin_only_route(current_user: dict = Depends(get_current_user)):
    return {"message": f"Hello admin {current_user['username']}", "roles": current_user['roles']}

@router.get("/reader-specific-route", dependencies=[Depends(RoleChecker(allowed_roles=["reader", "admin"]))]) 
async def reader_specific_route(current_user: dict = Depends(get_current_user)):
    return {"message": f"Special content for {current_user['username']}", "roles": current_user['roles']}

@router.get("/author-specific-route", dependencies=[Depends(RoleChecker(allowed_roles=["author", "admin"]))])
async def author_specific_route(current_user: dict = Depends(get_current_user)):
    return {"message": f"Special content for {current_user['username']}", "roles": current_user['roles']}

@router.get("/user-info")
async def get_user_info(current_user: dict = Depends(get_current_user)):
    return current_user




