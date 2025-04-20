from sqlalchemy import Column, Integer, String
from database import Base

class User(Base):
    __tablename__ = "users"

    ID = Column(Integer, primary_key=True, index=True)
    Name = Column(String, index=True)