from sqlalchemy import Column, Integer, String, ForeignKey, Table
from sqlalchemy.orm import relationship
from database import Base

# Many-to-Many: User ↔ Favourite Books
book_favourites = Table(
    'book_favourites', Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id'), primary_key=True),
    Column('book_id', Integer, ForeignKey('books.id'), primary_key=True)
)

# Many-to-Many: Book ↔ Category
book_categories = Table(
    'book_categories', Base.metadata,
    Column('category_id', Integer, ForeignKey('categories.id'), primary_key=True),
    Column('book_id', Integer, ForeignKey('books.id'), primary_key=True)
)

class Book(Base):
    __tablename__ = "books"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String, nullable=False)
    path = Column(String, nullable=False)
    description = Column(String)
    num_of_downloads = Column(Integer, default=0)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    author = relationship("User", back_populates="books_authored")
    reviews = relationship("Review", back_populates="book")
    sale_listings = relationship("BookForSale", back_populates="book")
    favourited_by = relationship("User", secondary=book_favourites, back_populates="favourite_books")
    categories = relationship("Category", secondary=book_categories, back_populates="books")

class BookForSale(Base):
    __tablename__ = "book_for_sale"

    listing_id = Column(Integer, primary_key=True, index=True)
    price = Column(Integer, nullable=False)
    book_id = Column(Integer, ForeignKey("books.id"), nullable=False, unique=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    book = relationship("Book", back_populates="sale_listings")
    seller = relationship("User", back_populates="books_for_sale")

class Script(Base):
    __tablename__ = "scripts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)  # Naziv fajla
    subject = Column(String, nullable=False)  # Predmet
    file_path = Column(String, nullable=False)  
    author_username = Column(String, nullable=False)