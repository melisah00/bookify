from pydantic import BaseModel

class UserCreate(BaseModel):
    Name: str
