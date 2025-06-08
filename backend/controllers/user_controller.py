from datetime import datetime
from sqlalchemy.future import select 
from fastapi import APIRouter, Depends, HTTPException, Path, Query, UploadFile, File 
from sqlalchemy.orm import Session
from typing import List, Optional

from models.user import User, Role, RoleNameEnum
from services.auth_service import get_current_user
from schemas import UserCreate, UserDisplay
from schemas.user import UserOut, UserDisplay2, AdminUserOut
from database import get_db, engine, get_async_db
from services import user_service
from sqlalchemy.orm import selectinload
from schemas.user import UserUpdateRequest
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import and_, func, select

router = APIRouter(prefix="/users", tags=["Users"])

def get_session():
    with Session(engine) as session:
        yield session

@router.post("/", response_model=UserDisplay, status_code=201)
async def create_user(user_data: UserCreate, db: Session = Depends(get_session)):
    return await user_service.create_user_service(user_data, db)

@router.get("/", response_model=List[UserDisplay])
async def get_all_users(db: Session = Depends(get_session)):
    return await user_service.get_all_users_service(db)

@router.get("/roles")
async def get_all_roles(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Role.name))
    role_names = [row[0] for row in result.all()]
    return role_names

@router.get("/profile")
async def get_user_profile(
    token_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = int(token_user["id"])
    return await user_service.get_user_profile(user_id, db)


@router.post("/profile")
async def update_user_profile(
    update: UserUpdateRequest,
    token_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = int(token_user["id"])
    return await user_service.update_user_profile(user_id, update, db)

@router.get("/search-users", response_model=list[UserOut])
async def search_users(
    query: str = Query(...),
    token_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    current_user_id = int(token_user["id"])

    stmt = (
        select(User)
        .join(User.roles)
        .where(
            User.id != current_user_id,  # ← isključi trenutno logovanog
            Role.name.in_([RoleNameEnum.author.value, RoleNameEnum.reader.value]),
            (
                User.first_name.ilike(f"{query}%") |
                User.last_name.ilike(f"{query}%") |
                User.username.ilike(f"{query}%")
            )
        )
        .limit(5)
    )

    result = await db.execute(stmt)
    users = result.scalars().all()
    return users


@router.get("/{user_id}", response_model=UserDisplay)
async def get_user(user_id: int, db: AsyncSession = Depends(get_async_db)):
    return await user_service.get_user_by_id_service(user_id, db)
 
@router.get("/fe/{user_id}", response_model=UserDisplay2)
async def get_user(user_id: int, db: AsyncSession = Depends(get_async_db)):
    stmt = select(User).where(User.id == user_id).options(
        selectinload(User.roles),
        selectinload(User.followers),
        selectinload(User.following)
    )
    result = await db.execute(stmt)
    user = result.scalars().first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user

@router.get("/favourites")
async def get_user_favourites(db: AsyncSession = Depends(get_async_db), current_user: User = Depends(get_current_user)):
    await db.refresh(current_user)
    return current_user.favourite_books

@router.post("/follow/{user_id}")
async def follow_user(
    user_id: int,
    token_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    current_user_id = int(token_user["id"])

    # Učitavamo korisnika zajedno sa `following`
    result = await db.execute(
        select(User)
        .options(selectinload(User.following))
        .where(User.id == current_user_id)
    )
    current_user = result.scalars().first()

    if not current_user:
        raise HTTPException(status_code=404, detail="Authenticated user not found")

    # Dohvati korisnika kojeg želiš pratiti
    result = await db.execute(select(User).where(User.id == user_id))
    user_to_follow = result.scalars().first()

    if not user_to_follow:
        raise HTTPException(status_code=404, detail="User not found")

    if user_to_follow in current_user.following:
        raise HTTPException(status_code=400, detail="Already following this user")

    current_user.following.append(user_to_follow)
    await db.commit()

    return {"detail": "Followed successfully"}


@router.delete("/unfollow/{user_id}")
async def unfollow_user(
    user_id: int,
    token_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    current_user_id = int(token_user["id"])

    # Učitaj current_user zajedno sa following relacijom
    result = await db.execute(
        select(User)
        .options(selectinload(User.following))
        .where(User.id == current_user_id)
    )
    current_user = result.scalars().first()

    if not current_user:
        raise HTTPException(status_code=404, detail="Authenticated user not found")

    # Učitaj usera kojeg želiš da "unfollowaš"
    result = await db.execute(select(User).where(User.id == user_id))
    user_to_unfollow = result.scalars().first()

    if not user_to_unfollow:
        raise HTTPException(status_code=404, detail="User not found")

    if user_to_unfollow not in current_user.following:
        raise HTTPException(status_code=400, detail="Not following this user")

    current_user.following.remove(user_to_unfollow)
    await db.commit()

    return {"detail": "Unfollowed successfully"}

@router.get("/is-following/{user_id}")
async def is_following(
    user_id: int,
    token_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    current_user_id = int(token_user["id"])

    result = await db.execute(
        select(User)
        .options(selectinload(User.following))
        .where(User.id == current_user_id)
    )
    current_user = result.scalars().first()

    if not current_user:
        raise HTTPException(status_code=404, detail="Authenticated user not found")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {"following": user in current_user.following}

@router.get("/count-followers/{user_id}")
async def count_followers(user_id: int, db: AsyncSession = Depends(get_async_db)):
    stmt = select(User).where(User.id == user_id).options(selectinload(User.followers))
    result = await db.execute(stmt)
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"followers_count": len(user.followers)}

@router.get("/count-following/{user_id}")
async def count_following(user_id: int, db: AsyncSession = Depends(get_async_db)):
    stmt = select(User).where(User.id == user_id).options(selectinload(User.following))
    result = await db.execute(stmt)
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"following_count": len(user.following)}

@router.get("/followers/{user_id}", response_model=List[UserOut])
async def get_followers(user_id: int, db: AsyncSession = Depends(get_async_db)):
    stmt = select(User).where(User.id == user_id).options(selectinload(User.followers))
    result = await db.execute(stmt)
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user.followers


@router.get("/following/{user_id}", response_model=List[UserOut])
async def get_following(user_id: int, db: AsyncSession = Depends(get_async_db)):
    stmt = select(User).where(User.id == user_id).options(selectinload(User.following))
    result = await db.execute(stmt)
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user.following

@router.post("/avatar", response_model=UserOut)
async def upload_avatar(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    return await user_service.upload_avatar_service(file, db, current_user)

@router.delete("/avatar")
async def delete_avatar(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await user_service.delete_avatar_service(db, current_user)

@router.get("/admin/users")
async def get_users_admin(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1),
    username: Optional[str] = Query(None),
    email: Optional[str] = Query(None),
    roles: Optional[List[str]] = Query(None),
):
    filters = []
    if username:
        filters.append(User.username.ilike(f"%{username}%"))
    if email:
        filters.append(User.email.ilike(f"%{email}%"))
    if roles:
        filters.append(User.roles.any(Role.name.in_(roles)))

    base_query = select(User).options(selectinload(User.roles))
    count_query = select(func.count()).select_from(User)

    if filters:
        base_query = base_query.where(and_(*filters))
        count_query = count_query.where(and_(*filters))

    total_result = await db.execute(count_query)
    total_count = total_result.scalar_one()

    base_query = base_query.offset((page - 1) * limit).limit(limit)
    result = await db.execute(base_query)
    users = result.scalars().all()

    return {
        "total_count": total_count,
        "users": [
            {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "icon": user.icon,
                "roles": [r.name for r in user.roles],
            }
            for user in users
        ],
    }

@router.put("/admin/{user_id}/role")
async def update_user_role(
    user_id: int = Path(..., gt=0),
    role_data: dict = None,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if "admin" not in current_user["roles"]:
        raise HTTPException(status_code=403, detail="Admins only")
    
    new_role = role_data.get("role")
    if not new_role:
        raise HTTPException(status_code=400, detail="Missing role")

    return await user_service.update_user_role(db, user_id, new_role)
