import enum
from datetime import date, datetime
from sqlalchemy import (
    create_engine, Column, Integer, String, Date, DateTime, Boolean, Text,
    ForeignKey, Table, Enum, PrimaryKeyConstraint, func
)
from sqlalchemy.orm import relationship, declarative_base
from database import Base 

# Definisanje Enum tipova
class RoleNameEnum(enum.Enum):
    admin = "admin"
    moderator = "moderator"
    user = "user"
    guest = "guest"

class CategoryEnum(enum.Enum):
    fiction = "fiction"
    non_fiction = "non_fiction"
    science = "science"
    history = "history"
    technology = "technology"

class EventParticipantStatusEnum(enum.Enum):
    registered = "registered"
    confirmed = "confirmed"
    cancelled = "cancelled"
    attended = "attended"


# --- Asocijacijske tabele (Many-to-Many) ---

user_followers = Table('user_followers', Base.metadata,
    Column('user1_id', Integer, ForeignKey('users.id'), primary_key=True), # Korisnik koji prati
    Column('user2_id', Integer, ForeignKey('users.id'), primary_key=True)  # Korisnik koji je praćen
)

user_interests = Table('user_interests', Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id'), primary_key=True),
    Column('category_id', Integer, ForeignKey('categories.id'), primary_key=True)
)

user_role = Table('user_role', Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id'), primary_key=True),
    Column('role_id', Integer, ForeignKey('role.id'), primary_key=True)
)

book_favourites = Table('book_favourites', Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id'), primary_key=True),
    Column('book_id', Integer, ForeignKey('books.id'), primary_key=True)
)

book_categories = Table('book_categories', Base.metadata,
    Column('category_id', Integer, ForeignKey('categories.id'), primary_key=True),
    Column('book_id', Integer, ForeignKey('books.id'), primary_key=True)
)

class User(Base):
    __tablename__ = 'users'

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
        backref="followers" # Korisnici koji prate ovog korisnika
    )
    interests = relationship("Category", secondary=user_interests, back_populates="users")
    roles = relationship("Role", secondary=user_role, back_populates="users")
    books_authored = relationship("Book", back_populates="author")
    books_for_sale = relationship("BookForSale", back_populates="seller")
    favourite_books = relationship("Book", secondary=book_favourites, back_populates="favourited_by")
    reviews = relationship("Review", back_populates="user")
    events_organized = relationship("Event", back_populates="organizer")
    event_participations = relationship("EventParticipant", back_populates="user")
    notifications_received = relationship("Notification", back_populates="recipient")
    forum_topics_created = relationship("ForumTopic", back_populates="creator")
    forum_posts = relationship("ForumPost", back_populates="user")

class Role(Base):
    __tablename__ = 'role'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(Enum(RoleNameEnum), nullable=False, unique=True)
 
    users = relationship("User", secondary=user_role, back_populates="roles")

class Category(Base):
    __tablename__ = 'categories'

    id = Column(Integer, primary_key=True, index=True)
    category = Column(Enum(CategoryEnum), nullable=False, unique=True)

    users = relationship("User", secondary=user_interests, back_populates="interests")
    books = relationship("Book", secondary=book_categories, back_populates="categories")

class Book(Base):
    __tablename__ = 'books'

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    path = Column(String, nullable=False)
    num_of_downloads = Column(Integer, default=0)
    author_id = Column(Integer, ForeignKey('users.id'), nullable=False)
 
    author = relationship("User", back_populates="books_authored")
    sale_listings = relationship("BookForSale", back_populates="book")
    favourited_by = relationship("User", secondary=book_favourites, back_populates="favourite_books")
    categories = relationship("Category", secondary=book_categories, back_populates="books")
    reviews = relationship("Review", back_populates="book")

class BookForSale(Base):
    __tablename__ = 'book_for_sale'

    listing_id = Column(Integer, primary_key=True, index=True)
    price = Column(Integer, nullable=False) 
    book_id = Column(Integer, ForeignKey('books.id'), nullable=False, unique=True) 
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)

    book = relationship("Book", back_populates="sale_listings")
    seller = relationship("User", back_populates="books_for_sale")

class Review(Base):
    __tablename__ = 'review'

    id = Column(Integer, primary_key=True, index=True)
    review = Column(Text, nullable=True)
    rating = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    book_id = Column(Integer, ForeignKey('books.id'), nullable=False)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)

    book = relationship("Book", back_populates="reviews")
    user = relationship("User", back_populates="reviews")

class Event(Base):
    __tablename__ = 'event'

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    event_date = Column(DateTime(timezone=True), nullable=False)
    location = Column(String, nullable=True) 
    is_online = Column(Boolean, default=False)
    meeting_link = Column(String, nullable=True) 
    guest_limit = Column(Integer, nullable=True)
    organizer_id = Column(Integer, ForeignKey('users.id'), nullable=False)

    organizer = relationship("User", back_populates="events_organized")
    participants = relationship("EventParticipant", back_populates="event")

class EventParticipant(Base):
    __tablename__ = 'event_participant'

    id = Column(Integer, primary_key=True, index=True)
    registered_at = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(Enum(EventParticipantStatusEnum), default=EventParticipantStatusEnum.registered)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    event_id = Column(Integer, ForeignKey('event.id'), nullable=False)

    __table_args__ = (PrimaryKeyConstraint('user_id', 'event_id', name='pk_event_participant'),)


 
    user = relationship("User", back_populates="event_participations")
    event = relationship("Event", back_populates="participants")

class Notification(Base):
    __tablename__ = 'notification' 

    id = Column(Integer, primary_key=True, index=True)
    message = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    recipient_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    is_read = Column(Boolean, default=False) 

 
    recipient = relationship("User", back_populates="notifications_received")

class ForumCategory(Base):
    __tablename__ = 'forum_category'

    category_id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    description = Column(Text, nullable=True)

    topics = relationship("ForumTopic", back_populates="category")

class ForumTopic(Base):
    __tablename__ = 'forum_topics'

    topic_id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey('forum_category.category_id'), nullable=False)
    creator_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True) 
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_activity = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    is_pinned = Column(Boolean, default=False)
    is_locked = Column(Boolean, default=False)
    view_count = Column(Integer, default=0)

 
    category = relationship("ForumCategory", back_populates="topics")
    creator = relationship("User", back_populates="forum_topics_created")
    posts = relationship("ForumPost", back_populates="topic", cascade="all, delete-orphan") # Brisanje postova ako se obriše tema

class ForumPost(Base):
    __tablename__ = 'forum_posts'

    post_id = Column(Integer, primary_key=True, index=True)
    topic_id = Column(Integer, ForeignKey('forum_topics.topic_id'), nullable=False)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    edited_at = Column(DateTime(timezone=True), nullable=True, onupdate=func.now())
    upvote = Column(Integer, default=0)
    downvote = Column(Integer, default=0)
    reply_to_post_id = Column(Integer, ForeignKey('forum_posts.post_id'), nullable=True) 

    topic = relationship("ForumTopic", back_populates="posts")
    user = relationship("User", back_populates="forum_posts")
    parent_post = relationship("ForumPost", remote_side=[post_id], backref="replies") 


