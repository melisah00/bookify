from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from database import Base
from sqlalchemy.sql import func

class ForumCategory(Base):
    __tablename__ = "forum_category"

    category_id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    description = Column(Text, nullable=True)

    topics = relationship("ForumTopic", back_populates="category")

class ForumTopic(Base):
    __tablename__ = "forum_topics"

    topic_id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("forum_category.category_id"), nullable=False)
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_activity = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    is_pinned = Column(Boolean, default=False)
    is_locked = Column(Boolean, default=False)
    view_count = Column(Integer, default=0)

    category = relationship("ForumCategory", back_populates="topics")
    creator = relationship("User", back_populates="forum_topics_created")
    posts = relationship("ForumPost", back_populates="topic", cascade="all, delete-orphan")

class ForumPost(Base):
    __tablename__ = "forum_posts"

    post_id = Column(Integer, primary_key=True, index=True)
    topic_id = Column(Integer, ForeignKey("forum_topics.topic_id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    edited_at = Column(DateTime(timezone=True), nullable=True, onupdate=func.now())
    upvote = Column(Integer, default=0)
    downvote = Column(Integer, default=0)
    reply_to_post_id = Column(Integer, ForeignKey("forum_posts.post_id"), nullable=True)

    topic = relationship("ForumTopic", back_populates="posts")
    user = relationship("User", back_populates="forum_posts")
    parent_post = relationship("ForumPost", remote_side=[post_id], backref="replies")
