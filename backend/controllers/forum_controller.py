from datetime import datetime
from http.client import HTTPException
from venv import logger
from sqlalchemy.orm import selectinload
from sqlalchemy import select, update
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from models import ForumPost, ForumTopic, User
from database import get_db
from schemas.forum import ForumPostCreate, ForumPostOut, VoteSchema
from sqlalchemy.exc import NoResultFound
from models.user import RoleNameEnum
from services.auth_service import get_current_user
from models.forum import ForumPost, ForumTopic
from schemas.forum import (
    ForumCategoryCreate,
    ForumPostCreate,
    ForumPostOut,
    ForumTopicCreate,
    TopicUpdateSchema,
)
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update
from typing import List

from models import ForumPost, ForumTopic, User
from database import get_async_db
from schemas.forum import ForumPostCreate, ForumPostOut, VoteSchema


from database import get_async_db, get_db
from schemas.forum import ForumCategoryDisplay, ForumTopicDisplay, ForumPostDisplay
from services import forum_service

router = APIRouter(prefix="/forum", tags=["Forum"])


# Kategorije
@router.get("/categories", response_model=List[ForumCategoryDisplay])
async def get_all_categories(db: AsyncSession = Depends(get_db)):
    return await forum_service.get_all_categories_service(db)


@router.post("/categories", response_model=ForumCategoryDisplay, status_code=201)
async def create_category(
    category: ForumCategoryCreate, db: AsyncSession = Depends(get_db)
):
    try:
        return await forum_service.create_category_service(category, db)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# New update category
@router.put("/categories/{category_id}", response_model=ForumCategoryDisplay)
async def update_category(
    category_id: int, category: ForumCategoryCreate, db: AsyncSession = Depends(get_db)
):
    try:
        return await forum_service.update_category_service(category_id, category, db)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.delete("/categories/{category_id}", status_code=204)
async def delete_category(category_id: int, db: AsyncSession = Depends(get_db)):
    deleted = await forum_service.delete_category_service(category_id, db)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Category not found"
        )
    return None


@router.delete("/categories/{category_id}/full-delete")
async def delete_category_with_contents(
    category_id: int, db: AsyncSession = Depends(get_db)
):
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


@router.post("/{topic_id}/increment-view", status_code=status.HTTP_204_NO_CONTENT)
async def increment_topic_view(topic_id: int, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(ForumTopic).where(ForumTopic.topic_id == topic_id))
    topic = res.scalar_one_or_none()
    if not topic:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Topic not found")

    topic.view_count = (topic.view_count or 0) + 1

    await db.commit()
    return


@router.get("/{topic_id}", response_model=ForumTopicDisplay)
async def get_topic(
    topic_id: int,
    db: AsyncSession = Depends(get_async_db),
):
    await db.execute(
        update(ForumTopic)
        .where(ForumTopic.topic_id == topic_id)
        .values(view_count=ForumTopic.view_count + 1)
    )
    await db.commit()

    result = await db.execute(
        select(ForumTopic).where(ForumTopic.topic_id == topic_id)
    )
    topic = result.scalars().first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    return topic


@router.put("/topics/{topic_id}", response_model=ForumTopicDisplay)
async def update_topic(
    topic_id: int, topic_update: TopicUpdateSchema, db: AsyncSession = Depends(get_db)
):
    try:
        return await forum_service.update_topic_service(topic_id, topic_update, db)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/topics/{topic_id}", status_code=204)
async def delete_topic(topic_id: int, db: AsyncSession = Depends(get_db)):
    deleted = await forum_service.delete_topic_service(topic_id, db)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Topic not found"
        )
    return None


# Postovi


@router.get("/topics/{topic_id}/posts", response_model=List[ForumPostOut])
async def get_posts(topic_id: int, db: AsyncSession = Depends(get_async_db)):
    result = await db.execute(
        select(ForumPost)
        .options(selectinload(ForumPost.user))
        .where(ForumPost.topic_id == topic_id)
        .order_by(ForumPost.created_at.asc())
    )
    posts = result.scalars().all()

    for p in posts:
        p.username = p.user.username

    return posts


@router.post("/posts", response_model=ForumPostOut, status_code=status.HTTP_201_CREATED)
async def create_post(
    post: ForumPostCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    result = await db.execute(
        select(ForumTopic).where(ForumTopic.topic_id == post.topic_id)
    )
    topic = result.scalars().first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    if post.reply_to_post_id is not None:
        result = await db.execute(
            select(ForumPost).where(ForumPost.post_id == post.reply_to_post_id)
        )
        parent = result.scalars().first()
        if not parent:
            raise HTTPException(status_code=404, detail="Parent post not found")

    new_post = ForumPost(
        content=post.content,
        topic_id=post.topic_id,
        user_id=current_user["id"],
        reply_to_post_id=post.reply_to_post_id,
    )
    db.add(new_post)

    try:
        await db.commit()
        await db.refresh(new_post)
    except Exception as e:
        await db.rollback()
        logger.exception("Error creating new forum post")
        raise HTTPException(
            status_code=500, detail=f"Database error during post creation: {e}"
        )

    return {
        "post_id": new_post.post_id,
        "topic_id": new_post.topic_id,
        "user_id": new_post.user_id,
        "content": new_post.content,
        "created_at": new_post.created_at,
        "edited_at": new_post.edited_at,
        "username": current_user["username"],
        "upvote": new_post.upvote,
        "downvote": new_post.downvote,
        "reply_to_post_id": new_post.reply_to_post_id,
    }


@router.patch("/posts/{post_id}/vote")
async def vote_post(
    post_id: int,
    vote: VoteSchema,
    db: AsyncSession = Depends(get_async_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(select(ForumPost).where(ForumPost.post_id == post_id))
    post = result.scalar_one_or_none()

    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    if vote.vote == 1:
        post.upvote += 1
    elif vote.vote == -1:
        post.downvote += 1
    else:
        raise HTTPException(status_code=400, detail="Invalid vote value")

    await db.commit()
    return {"message": "Vote recorded"}


@router.delete("/posts/{post_id}")
async def delete_post(
    post_id: int,
    db: AsyncSession = Depends(get_async_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(select(ForumPost).where(ForumPost.post_id == post_id))
    post = result.scalar_one_or_none()

    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    if user["id"] != post.user_id and not any(
        role in ["admin", "forum_moderator"] for role in user["roles"]
    ):
        raise HTTPException(status_code=403, detail="Not authorized")

    await db.delete(post)
    await db.commit()
    return {"message": "Post deleted"}
