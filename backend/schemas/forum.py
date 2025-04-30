from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class ForumCategoryDisplay(BaseModel):
    category_id: int
    name: str
    description: Optional[str] = None

    class Config:
        orm_mode = True

class ForumTopicDisplay(BaseModel):
    topic_id: int
    category_id: int
    creator_id: int
    title: str
    description: Optional[str] = None
    created_at: datetime
    last_activity: datetime
    is_pinned: bool
    is_locked: bool
    view_count: int

    class Config:
        orm_mode = True

class ForumPostDisplay(BaseModel):
    post_id: int
    topic_id: int
    user_id: int
    content: str
    created_at: datetime
    edited_at: Optional[datetime] = None
    upvote: int
    downvote: int
    reply_to_post_id: Optional[int] = None

    class Config:
        orm_mode = True
