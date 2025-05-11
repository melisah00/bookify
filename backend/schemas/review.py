from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field

class ReviewBase(BaseModel):
    rating: int = Field(..., ge=1, le=5, description="Ocena od 1 do 5")
    comment: Optional[str] = None

    class Config:
        model_config = ConfigDict(from_attributes=True)


class ReviewCreate(ReviewBase):
    user_id: int

class ReviewDisplay(ReviewBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    book_id: int
    user_id: int
