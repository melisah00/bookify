import enum
from sqlalchemy import Column, Integer, String, Date, ForeignKey, Table, Enum
from sqlalchemy.orm import relationship
from database import Base

# Enum definicije
class RoleNameEnum(enum.Enum):
    admin = "admin"
    author = "author"
    reader = "reader"
    forum_admin = "forum_admin"
    forum_moderator = "forum_moderator"

class CategoryEnum(enum.Enum):
    fiction = "fiction"
    non_fiction = "non_fiction"
    science = "science"
    history = "history"
    technology = "technology"

# Many-to-Many tabele
user_followers = Table(
    "user_followers", Base.metadata,
    Column("user1_id", Integer, ForeignKey("users.id"), primary_key=True),
    Column("user2_id", Integer, ForeignKey("users.id"), primary_key=True)
)

user_interests = Table(
    "user_interests", Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id"), primary_key=True),
    Column("category_id", Integer, ForeignKey("categories.id"), primary_key=True)
)

user_role = Table(
    "user_role", Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id"), primary_key=True),
    Column("role_id", Integer, ForeignKey("role.id"), primary_key=True)
)

# Entiteti
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    icon = Column(String, nullable=True)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    date_of_birth = Column(Date, nullable=True)
    age = Column(Integer, nullable=True)

    following = relationship(
        "User",
        secondary=user_followers,
        primaryjoin=(user_followers.c.user1_id == id),
        secondaryjoin=(user_followers.c.user2_id == id),
        backref="followers"
    )

    interests = relationship("Category", secondary=user_interests, back_populates="users")
    roles = relationship("Role", secondary=user_role, back_populates="users")
    books_authored = relationship("Book", back_populates="author")
    books_for_sale = relationship("BookForSale", back_populates="seller")
    favourite_books = relationship("Book", secondary="book_favourites", back_populates="favourited_by")
    reviews = relationship("Review", back_populates="user")
    events_organized = relationship("Event", back_populates="organizer")
    event_participations = relationship("EventParticipant", back_populates="user")
    notifications_received = relationship("Notification", back_populates="recipient")
    forum_topics_created = relationship("ForumTopic", back_populates="creator")
    forum_posts = relationship("ForumPost", back_populates="user")

class Role(Base):
    __tablename__ = "role"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(Enum(RoleNameEnum), nullable=False, unique=True)

    users = relationship("User", secondary=user_role, back_populates="roles")

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    category = Column(Enum(CategoryEnum), nullable=False, unique=True)

    users = relationship("User", secondary=user_interests, back_populates="interests")
    books = relationship("Book", secondary="book_categories", back_populates="categories")
