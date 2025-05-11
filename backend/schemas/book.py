from typing import Optional
from pydantic import BaseModel, Field
from schemas.user import UserDisplay  

class BookCreate(BaseModel):
    title: str = Field(..., min_length=1, example="Gospodar Prstenova")
    path: str = Field(..., min_length=1, example="/books/lotr.pdf")
    author_id: int = Field(..., gt=0)

class BookAverageRating(BaseModel):
    book_id: int
    average_rating: Optional[float] = None

    class Config:
        from_attributes = True

class BookDisplay(BaseModel):
    id: int
    title: str
    path: str
    num_of_downloads: int
    author: UserDisplay  
    class Config:
        from_attributes = True
