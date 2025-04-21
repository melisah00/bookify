from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserDisplay(BaseModel):
    id: int
    username: str
    email: EmailStr
    first_name: str | None = None
    last_name: str | None = None

    class Config:
        orm_mode = True 

class BookCreate(BaseModel):
    title: str = Field(..., min_length=1, example="Gospodar Prstenova")
    path: str = Field(..., min_length=1, example="/books/lotr.pdf") 
    author_id: int = Field(..., gt=0, example=1) 

class BookDisplay(BaseModel):
    id: int
    title: str
    path: str
    num_of_downloads: int
    author_id: int

    class Config:
        orm_mode = True

class ReviewBase(BaseModel):
    rating: int = Field(..., ge=1, le=5, description="Ocena od 1 do 5")
    comment: Optional[str] = None 

    class Config:
        orm_mode = True 


class ReviewCreate(ReviewBase):
    book_id: int
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