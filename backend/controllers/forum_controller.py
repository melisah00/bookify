from http.client import HTTPException
import select
import forum_service
from models.user import RoleNameEnum
from forum_service.auth_service import get_current_user
from models.forum import ForumPost, ForumTopic
from schemas.forum import ForumCategoryCreate, ForumPostCreate, ForumPostDisplay, ForumTopicCreate, TopicUpdateSchema
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from database import get_async_db, get_db
from schemas import ForumCategoryDisplay, ForumTopicDisplay, ForumPostDisplay
from forum_service import forum_service

router = APIRouter(prefix="/forum", tags=["Forum"])

# Kategorije
@router.get("/categories", response_model=List[ForumCategoryDisplay])
async def get_all_categories(db: AsyncSession = Depends(get_db)):
    return await forum_service.get_all_categories_service(db)

@router.post("/categories", response_model=ForumCategoryDisplay, status_code=201)
async def create_category(category: ForumCategoryCreate, db: AsyncSession = Depends(get_db)):
    try:
        return await forum_service.create_category_service(category, db)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    

# New update category
@router.put("/categories/{category_id}", response_model=ForumCategoryDisplay)
async def update_category(category_id: int, category: ForumCategoryCreate, db: AsyncSession = Depends(get_db)):
    try:
        return await forum_service.update_category_service(category_id, category, db)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

# New delete category
@router.delete("/categories/{category_id}", status_code=204)
async def delete_category(category_id: int, db: AsyncSession = Depends(get_db)):
    deleted = await forum_service.delete_category_service(category_id, db)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    return None


@router.delete("/categories/{category_id}/full-delete")
async def delete_category_with_contents(category_id: int, db: AsyncSession = Depends(get_db)):
    await forum_service.delete_category_and_contents(category_id, db)
    return {"message": "Kategorija i sav sadržaj su obrisani."}


# Teme
@router.get("/categories/{category_id}/topics", response_model=List[ForumTopicDisplay])
async def get_topics_by_category(category_id: int, db: AsyncSession = Depends(get_db)):
    return await forum_service.get_topics_by_category_service(category_id, db)

@router.get("/topics/{topic_id}", response_model=ForumTopicDisplay)
async def get_topic(topic_id: int, db: AsyncSession = Depends(get_db)):
    return await forum_service.get_topic_by_id_service(topic_id, db)

@router.post("/topics", response_model=ForumTopicDisplay, status_code=201)
async def create_topic(data: ForumTopicCreate, db: AsyncSession = Depends(get_db)):
    return await forum_service.create_topic_service(data, db)

@router.put("/topics/{topic_id}", response_model=ForumTopicDisplay)
async def update_topic(topic_id: int, topic_update: TopicUpdateSchema, db: AsyncSession = Depends(get_db)):
    try:
        return await forum_service.update_topic_service(topic_id, topic_update, db)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# New delete topic
@router.delete("/topics/{topic_id}", status_code=204)
async def delete_topic(topic_id: int, db: AsyncSession = Depends(get_db)):
    deleted = await forum_service.delete_topic_service(topic_id, db)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Topic not found")
    return None


# # Postovi
# @router.get("/topics/{topic_id}/posts", response_model=List[ForumPostDisplay])
# async def get_posts_by_topic(topic_id: int, db: AsyncSession = Depends(get_db)):
#     return await forum_service.get_posts_by_topic_service(topic_id, db)

# @router.post("/posts", response_model=ForumPostDisplay, status_code=201)
# async def create_post(data: ForumPostDisplay, db: AsyncSession = Depends(get_db)):
#     return await forum_service.create_post_service(data, db)


# @router.get("/{topic_id}/posts", response_model=List[ForumPostDisplay])
# async def get_topic_posts(
#     topic_id: int,
#     db: AsyncSession = Depends(get_async_db),
# ):
#     result = await db.execute(
#         select(ForumPost).where(ForumPost.topic_id == topic_id)
#     )
#     posts = result.scalars().all()
#     if not posts:
#         # provjera da li postoji topic
#         topic = await db.get(ForumTopic, topic_id)
#         if not topic:
#             raise HTTPException(status_code=404, detail="Topic not found")
#     return posts

# @router.delete("/posts/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
# async def delete_post(
#     post_id: int,
#     db: AsyncSession = Depends(get_async_db),
#     current_user=Depends(get_current_user),
# ):
#     post = await db.get(ForumPost, post_id)
#     if not post:
#         raise HTTPException(status_code=404, detail="Post not found")

#     role_names = {r.name for r in current_user.roles}
#     if RoleNameEnum.admin not in role_names and RoleNameEnum.forum_moderator not in role_names:
#         raise HTTPException(status_code=403, detail="Not enough permissions")

#     await db.delete(post)
#     await db.commit()
#     return

@router.post("/posts/", response_model=ForumPostDisplay)
async def create_post(post: ForumPostCreate, db: AsyncSession = Depends(get_db)):
    return await forum_service.create_post_service(db, post)

@router.get("/posts/topic/{topic_id}", response_model=list[ForumPostDisplay])
async def get_posts(topic_id: int, db: AsyncSession = Depends(get_db)):
    return await forum_service.get_posts_by_topic_service(db, topic_id)

@router.delete("/posts/{post_id}")
async def delete_post(post_id: int, db: AsyncSession = Depends(get_db)):
    success = await forum_service.delete_post_service(db, post_id)
    if not success:
        raise HTTPException(status_code=404, detail="Post not found")
    return {"message": "Post deleted"}

@router.get("/topics/{topic_id}/posts", response_model=List[ForumPostDisplay])
async def get_posts_for_topic(topic_id: int, session: AsyncSession = Depends(get_db)):
    result = await session.execute(select(ForumPost).where(ForumPost.topic_id == topic_id))
    posts = result.scalars().all()
    if not posts:
        raise HTTPException(status_code=404, detail="Posts not found for this topic")
    return posts
