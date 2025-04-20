from sqlalchemy import Column, Integer, String
from database import Base

class User(Base):
    __tablename__ = "users"

    ID = Column(Integer, primary_key=True, index=True)
    Name = Column(String, index=True)

class Test(Base):
    __tablename__ = "test"

    ID = Column(Integer, primary_key=True, index=True)
    Name = Column(String, index=True)

class Test2(Base):
    __tablename__ = "test2"

    ID = Column(Integer, primary_key=True, index=True)
    Name = Column(String, index=True)

class Test3(Base):
    __tablename__ = "test3"

    ID = Column(Integer, primary_key=True, index=True)
    Name = Column(String, index=True)