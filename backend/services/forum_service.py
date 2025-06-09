from schemas.forum import (
    ForumCategoryCreate,
    ForumCategoryDisplay,
    ForumPostCreate,
    ForumTopicCreate,
    ForumTopicDisplay,
    ForumPostDisplay,
    TopicUpdateSchema,
)
from fastapi import HTTPException
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession

from models import ForumCategory, ForumTopic, ForumPost, User
from schemas import ForumTopicDisplay, ForumPostDisplay
from repositories import forum_repository
from sqlalchemy import select, delete


# Kategorije
async def get_all_categories_service(db: AsyncSession) -> List[ForumCategory]:
    return await forum_repository.get_all_categories(db)


async def create_category_service(category_data: ForumCategoryCreate, db: AsyncSession):
    new_category = ForumCategory(
        name=category_data.name, description=category_data.description
    )
    db.add(new_category)
    try:
        await db.commit()
        await db.refresh(new_category)
        return new_category
    except IntegrityError:
        await db.rollback()
        raise ValueError("Kategorija s tim nazivom već postoji.")


async def update_category_service(
    category_id: int, category_data: ForumCategoryCreate, db: AsyncSession
) -> ForumCategory:
    category = await db.get(ForumCategory, category_id)
    if not category:
        raise ValueError("Kategorija nije pronađena.")
    category.name = category_data.name
    category.description = category_data.description
    try:
        await db.commit()
        await db.refresh(category)
        return category
    except IntegrityError:
        await db.rollback()
        raise ValueError("Kategorija s tim nazivom već postoji.")


async def delete_category_service(category_id: int, db: AsyncSession) -> bool:
    category = await db.get(ForumCategory, category_id)
    if not category:
        return False
    await db.delete(category)
    await db.commit()
    return True


async def delete_category_and_contents(category_id: int, db: AsyncSession):
    topics_stmt = select(ForumTopic.topic_id).where(
        ForumTopic.category_id == category_id
    )
    result = await db.execute(topics_stmt)
    topic_ids = [row[0] for row in result.fetchall()]

    if topic_ids:
        await db.execute(delete(ForumPost).where(ForumPost.topic_id.in_(topic_ids)))

        await db.execute(delete(ForumTopic).where(ForumTopic.topic_id.in_(topic_ids)))

    await db.execute(
        delete(ForumCategory).where(ForumCategory.category_id == category_id)
    )
    await db.commit()


# Teme
async def get_topics_by_category_service(
    category_id: int, db: AsyncSession
) -> List[ForumTopic]:
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


async def update_topic_service(
    topic_id: int, topic_data: TopicUpdateSchema, db: AsyncSession
) -> ForumTopic:
    topic = await db.get(ForumTopic, topic_id)
    if not topic:
        raise ValueError("Topic not found.")

    topic.title = topic_data.title
    topic.description = topic_data.description
    topic.is_pinned = topic_data.is_pinned
    topic.is_locked = topic_data.is_locked

    await db.commit()
    await db.refresh(topic)
    return topic


async def delete_topic_service(topic_id: int, db: AsyncSession) -> bool:
    topic = await db.get(ForumTopic, topic_id)
    if not topic:
        return False
    await db.delete(topic)
    await db.commit()
    return True


# Postovi
async def create_post_service(
    db: AsyncSession, post_data: ForumPostCreate
) -> ForumPost:
    return await forum_repository.create_post(db, post_data)


async def get_posts_by_topic_service(
    db: AsyncSession, topic_id: int
) -> list[ForumPost]:
    return await forum_repository.get_posts_by_topic(db, topic_id)


async def delete_post_service(db: AsyncSession, post_id: int) -> bool:
    return await forum_repository.delete_post(db, post_id)
