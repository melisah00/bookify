from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from database import get_db
from schemas import ForumCategoryDisplay, ForumTopicDisplay, ForumPostDisplay
from services import forum_service

router = APIRouter(prefix="/forum", tags=["Forum"])

# Kategorije
@router.get("/categories", response_model=List[ForumCategoryDisplay])
async def get_all_categories(db: AsyncSession = Depends(get_db)):
    return await forum_service.get_all_categories_service(db)

# Teme
@router.get("/categories/{category_id}/topics", response_model=List[ForumTopicDisplay])
async def get_topics_by_category(category_id: int, db: AsyncSession = Depends(get_db)):
    return await forum_service.get_topics_by_category_service(category_id, db)

@router.get("/topics/{topic_id}", response_model=ForumTopicDisplay)
async def get_topic(topic_id: int, db: AsyncSession = Depends(get_db)):
    return await forum_service.get_topic_by_id_service(topic_id, db)

@router.post("/topics", response_model=ForumTopicDisplay, status_code=201)
async def create_topic(data: ForumTopicDisplay, db: AsyncSession = Depends(get_db)):
    return await forum_service.create_topic_service(data, db)

# Postovi
@router.get("/topics/{topic_id}/posts", response_model=List[ForumPostDisplay])
async def get_posts_by_topic(topic_id: int, db: AsyncSession = Depends(get_db)):
    return await forum_service.get_posts_by_topic_service(topic_id, db)

@router.post("/posts", response_model=ForumPostDisplay, status_code=201)
async def create_post(data: ForumPostDisplay, db: AsyncSession = Depends(get_db)):
    return await forum_service.create_post_service(data, db)
