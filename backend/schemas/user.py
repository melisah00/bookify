from typing import List, Optional
from pydantic import BaseModel, EmailStr
from models.user import RoleNameEnum  # koristi Enum iz modela

class Role(BaseModel):
    id: int
    name: RoleNameEnum

    class Config:
        orm_mode = True

class UserBase(BaseModel):
    username: str
    email: EmailStr
    roles: Optional[List[Role]] = None

class UserCreate(UserBase):
    password: str
    roles: Optional[List[RoleNameEnum]] = [RoleNameEnum.reader]

class UserDisplay(UserBase):
    id: int
    roles: List[Role]

    class Config:
        orm_mode = True
