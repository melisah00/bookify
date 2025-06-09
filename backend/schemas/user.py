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
    icon: Optional[str] = None


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


class UserOut(BaseModel):
    id: int
    username: str
    first_name: Optional[str]
    last_name: Optional[str]
    icon: Optional[str] = None

    class Config:
        model_config = ConfigDict(from_attributes=True)


class RoleDisplay(BaseModel):
    id: int
    name: RoleNameEnum

    model_config = ConfigDict(from_attributes=True)


class FollowerDisplay(BaseModel):
    id: int
    username: str

    model_config = ConfigDict(from_attributes=True)


class UserDisplay2(BaseModel):
    id: int
    username: str
    first_name: Optional[str]
    last_name: Optional[str]
    email: str
    roles: List[RoleDisplay]
    followers: List[FollowerDisplay]
    following: List[FollowerDisplay]
    icon: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class AdminUserOut(BaseModel):
    id: int
    username: str
    email: str
    first_name: Optional[str]
    last_name: Optional[str]
    icon: Optional[str] = None
    roles: List[str]

    model_config = ConfigDict(from_attributes=True)