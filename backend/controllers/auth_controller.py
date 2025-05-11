# controllers/auth_controller.py
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request, Response, Cookie
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Annotated
from fastapi.security import OAuth2PasswordRequestForm
from models import User
from models.user import Role, RoleNameEnum
from models.dto_auth_model import Token, CreateUserRequest
from services.auth_service import (
    authenticate_user, create_access_token, get_current_user,
    bcrypt_context, credentials_exception, RoleChecker
)
from sqlalchemy import select
from database import get_db
from fastapi.responses import JSONResponse

router = APIRouter(
    prefix="/auth",
    tags=["auth"]
)

db_dependency = Annotated[AsyncSession, Depends(get_db)]

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def create_user(create_user_request: CreateUserRequest, db: AsyncSession = Depends(get_db)):
    existing_user = await db.execute(select(User).filter(User.username == create_user_request.username))
    if existing_user.scalars().first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username already exists.")

    existing_email = await db.execute(select(User).filter(User.email == create_user_request.email))
    if existing_email.scalars().first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already exists.")

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
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Reader role not found")

    new_user.roles.append(reader_role)
    db.add(new_user)
    try:
        await db.commit()
        await db.refresh(new_user)
        await db.refresh(new_user, attribute_names=["roles"])
        return {
            "id": new_user.id,
            "username": new_user.username,
            "email": new_user.email,
            "first_name": new_user.first_name,
            "last_name": new_user.last_name,
            "icon": new_user.icon,
            "roles": [role.name.value for role in new_user.roles] if new_user.roles else []
        }
    except Exception:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while creating the account."
        )

@router.post("/login")
async def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: AsyncSession = Depends(get_db)
):
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

    response = JSONResponse(content={"message": "Login successful"})
    response.set_cookie(
        key="token",
        value=access_token,
        httponly=True,
        max_age=20 * 60,
        samesite="Lax",
        secure=False,
        path="/"
    )
    return response

@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("token")  # match cookie name if different
    return {"detail": "Logout successful"}

@router.get("/user-info")
async def get_user_info(current_user: dict = Depends(get_current_user)):
    return current_user

@router.get("/admin-only-route", dependencies=[Depends(RoleChecker(["admin"]))])
async def admin_only_route(current_user: dict = Depends(get_current_user)):
    return {"message": f"Hello admin {current_user['username']}", "roles": current_user['roles']}

@router.get("/reader-specific-route", dependencies=[Depends(RoleChecker(["reader", "admin"]))])
async def reader_specific_route(current_user: dict = Depends(get_current_user)):
    return {"message": f"Special content for {current_user['username']}", "roles": current_user['roles']}

@router.get("/author-specific-route", dependencies=[Depends(RoleChecker(["author", "admin"]))])
async def author_specific_route(current_user: dict = Depends(get_current_user)):
    return {"message": f"Special content for {current_user['username']}", "roles": current_user['roles']}
