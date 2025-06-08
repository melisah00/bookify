from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class ForumCategoryDisplay(BaseModel):
    category_id: int
    name: str
    description: Optional[str] = None

    class Config:
        model_config = ConfigDict(from_attributes=True)


class ForumCategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None



class ForumTopicCreate(BaseModel):
    category_id: int
    creator_id: int
    title: str
    description: Optional[str] = None
    is_pinned: bool
    is_locked: bool

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
        model_config = ConfigDict(from_attributes=True)

class TopicUpdateSchema(BaseModel):
    title: str
    description: Optional[str] = None
    is_pinned: bool
    is_locked: bool

# class ForumPostDisplay(BaseModel):
#     post_id: int
#     topic_id: int
#     user_id: int
#     content: str
#     created_at: datetime
#     edited_at: Optional[datetime] = None
#     upvote: int
#     downvote: int
#     reply_to_post_id: Optional[int] = None

#     class Config:
#         model_config = ConfigDict(from_attributes=True)



class ForumPostCreate(BaseModel):
    topic_id: int
    user_id: int
    content: str
    reply_to_post_id: Optional[int] = None

class ForumPostDisplay(BaseModel):
    post_id: int
    topic_id: int
    user_id: int
    content: str
    created_at: datetime
    edited_at: Optional[datetime] = None
    upvote: int
    downvote: int
    reply_to_post_id: Optional[int]
    # username: Optional[str]  # ako koristiš JOIN kasnije

    class Config:
        orm_mode = True