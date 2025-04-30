from fastapi import HTTPException
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession

from models import ForumCategory, ForumTopic, ForumPost, User
from schemas import ForumTopicDisplay, ForumPostDisplay
from repositories import forum_repository

# Kategorije
async def get_all_categories_service(db: AsyncSession) -> List[ForumCategory]:
    return await forum_repository.get_all_categories(db)

# Teme
async def get_topics_by_category_service(category_id: int, db: AsyncSession) -> List[ForumTopic]:
    category = await db.get(ForumCategory, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Forum category not found")
    return await forum_repository.get_topics_by_category(category_id, db)

async def get_topic_by_id_service(topic_id: int, db: AsyncSession) -> ForumTopic:
    topic = await forum_repository.get_topic_by_id(topic_id, db)
    if not topic:
        raise HTTPException(status_code=404, detail="Forum topic not found")
    return topic

async def create_topic_service(data: ForumTopicDisplay, db: AsyncSession) -> ForumTopic:
    user = await db.get(User, data.creator_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    category = await db.get(ForumCategory, data.category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Forum category not found")

    topic = ForumTopic(**data.dict())
    return await forum_repository.create_topic(topic, db)

# Postovi
async def get_posts_by_topic_service(topic_id: int, db: AsyncSession) -> List[ForumPost]:
    topic = await forum_repository.get_topic_by_id(topic_id, db)
    if not topic:
        raise HTTPException(status_code=404, detail="Forum topic not found")
    return await forum_repository.get_posts_by_topic(topic_id, db)

async def create_post_service(data: ForumPostDisplay, db: AsyncSession) -> ForumPost:
    user = await db.get(User, data.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    topic = await forum_repository.get_topic_by_id(data.topic_id, db)
    if not topic:
        raise HTTPException(status_code=404, detail="Forum topic not found")

    post = ForumPost(**data.dict())
    return await forum_repository.create_post(post, db)
