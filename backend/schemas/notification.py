from datetime import datetime
from pydantic import BaseModel, ConfigDict

class NotificationDisplay(BaseModel):
    id: int
    message: str
    created_at: datetime
    is_read: bool
    recipient_id: int

    class Config:
        model_config = ConfigDict(from_attributes=True)
