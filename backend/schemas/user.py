from typing import List, Optional
from pydantic import BaseModel, ConfigDict, EmailStr
from models.user import RoleNameEnum 
from datetime import date


class Role(BaseModel):
    id: int
    name: RoleNameEnum

    class Config:
        model_config = ConfigDict(from_attributes=True)

class UserBase(BaseModel):
    username: str
    email: EmailStr
    roles: Optional[List[Role]] = None

class UserCreate(UserBase):
    password: str
    roles: Optional[List[RoleNameEnum]] = [RoleNameEnum.reader]

class UserUpdateRequest(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    date_of_birth: Optional[str] = None

class UserDisplay(UserBase):
    id: int
    roles: List[Role]

    class Config:
        model_config = ConfigDict(from_attributes=True)

