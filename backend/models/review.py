from sqlalchemy import Column, Integer, Text, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship
from database import Base

class Review(Base):
    __tablename__ = "review"

    id = Column(Integer, primary_key=True, index=True)
    review = Column(Text, nullable=True)
    rating = Column(Integer, nullable=False)
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    book_id = Column(Integer, ForeignKey("books.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    book = relationship("Book", back_populates="reviews")
    user = relationship("User", back_populates="reviews")
