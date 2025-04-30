from datetime import datetime
import enum
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import Enum

from models import RoleNameEnum


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
    roles: Optional[List[RoleNameEnum]] = [RoleNameEnum.reader]  # Default role


class UserDisplay(UserBase):
    id: int
    roles: List[Role]

    class Config:
        orm_mode = True


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None


class BookCreate(BaseModel):
    title: str = Field(..., min_length=1, example="Gospodar Prstenova")
    path: str = Field(..., min_length=1, example="/books/lotr.pdf") 
    author_id: int = Field(..., gt=0, example=1) 


class ReviewBase(BaseModel):
    rating: int = Field(..., ge=1, le=5, description="Ocena od 1 do 5")
    comment: Optional[str] = None 

    class Config:
        orm_mode = True 


class ReviewCreate(ReviewBase):
    user_id: int 


class ReviewDisplay(ReviewBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    book_id: int
    user_id: int

class BookAverageRating(BaseModel):
    book_id: int
    average_rating: Optional[float] = None 

    class Config:
        orm_mode = True


class BookDisplay(BaseModel):
    id: int
    title: str
    path: str 
    num_of_downloads: int
    author: UserDisplay  

    class Config:
        orm_mode = True
