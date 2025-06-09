from pydantic import BaseModel

class ScriptSchema(BaseModel):
    id: int
    name: str
    subject: str
    author_username: str

    class Config:
        orm_mode = True