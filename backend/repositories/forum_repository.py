from typing import List, Optional
from schemas.forum import ForumPostCreate
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from models import ForumCategory, ForumTopic, ForumPost

# Kategorije
async def get_all_categories(db: AsyncSession) -> List[ForumCategory]:
    result = await db.execute(select(ForumCategory))
    return result.scalars().all()

# Teme
async def get_topics_by_category(category_id: int, db: AsyncSession) -> List[ForumTopic]:
    result = await db.execute(
        select(ForumTopic).where(ForumTopic.category_id == category_id)
    )
    return result.scalars().all()

async def get_topic_by_id(topic_id: int, db: AsyncSession) -> Optional[ForumTopic]:
    return await db.get(ForumTopic, topic_id)

async def create_topic(topic: ForumTopic, db: AsyncSession) -> ForumTopic:
    db.add(topic)
    await db.commit()
    await db.refresh(topic)
    return topic

# Postovi
# async def get_posts_by_topic(topic_id: int, db: AsyncSession) -> List[ForumPost]:
#     result = await db.execute(
#         select(ForumPost).where(ForumPost.topic_id == topic_id)
#     )
#     return result.scalars().all()

# async def create_post(post: ForumPost, db: AsyncSession) -> ForumPost:
#     db.add(post)
#     await db.commit()
#     await db.refresh(post)
#     return post
async def create_post(db: AsyncSession, post_data: ForumPostCreate) -> ForumPost:
    new_post = ForumPost(**post_data.dict())
    db.add(new_post)
    await db.commit()
    await db.refresh(new_post)
    return new_post

async def get_posts_by_topic(db: AsyncSession, topic_id: int) -> list[ForumPost]:
    result = await db.execute(select(ForumPost).where(ForumPost.topic_id == topic_id))
    return result.scalars().all()

async def delete_post(db: AsyncSession, post_id: int) -> bool:
    result = await db.execute(select(ForumPost).where(ForumPost.post_id == post_id))
    post = result.scalar_one_or_none()
    if not post:
        return False
    await db.delete(post)
    await db.commit()
    return True