from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field
from schemas.user import UserDisplay  # biće definisan kasnije

class BookCreate(BaseModel):
    title: str
    path: str
    author_id: int
    description: Optional[str] = None


class BookAverageRating(BaseModel):
    book_id: int
    average_rating: Optional[float] = None

    class Config:
        model_config = ConfigDict(from_attributes=True)

class BookDisplay(BaseModel):
    id: int
    title: str
    path: str
    num_of_downloads: int
    description: Optional[str] = None 
    author: UserDisplay

    class Config:
        model_config = ConfigDict(from_attributes=True)

class CategoryResponseSimpleSchema(BaseModel):
    id: int
    category: str

    class Config:
        from_attributes = True


class BookResponseSchema(BaseModel):
    id: int
    title: str
    path: str
    author_id: int
    num_of_downloads: int
    description: Optional[str] = None
    categories: List[CategoryResponseSimpleSchema] = []

    class Config:
        from_attributes = True