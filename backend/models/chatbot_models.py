from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

class ChatMessage(BaseModel):
    text: str
    session_id: str
    user_context: Optional[Dict[str, Any]] = None
    timestamp: Optional[datetime] = None

class ChatResponse(BaseModel):
    text: str
    sources: List[str] = []
    confidence: float
    session_id: str
    suggestions: List[str] = []

class ChatSession(BaseModel):
    session_id: str
    messages: List[Dict[str, Any]]
    created_at: datetime
    last_activity: datetime