from datetime import datetime
from pydantic import BaseModel

class NotificationDisplay(BaseModel):
    id: int
    message: str
    created_at: datetime
    is_read: bool
    recipient_id: int

    class Config:
        from_attributes = True
