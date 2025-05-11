from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
# Pydantic models for expected request/response bodies
class CreateUserRequest(BaseModel):
    username: str
    email: EmailStr
    icon: Optional[str] = None
    first_name: str
    last_name: str
    password: str
    date_of_birth: Optional[datetime] = None
    age: Optional[int] = None

class Token(BaseModel):
    access_token: str
    token_type: str

