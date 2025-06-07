from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import joinedload, selectinload
from database import get_db
from models.user import ChatMessage, User
from datetime import datetime
from typing import List
from pydantic import BaseModel


router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            await connection.send_json(message)

manager = ConnectionManager()

@router.websocket("/ws/chat")
async def websocket_chat(websocket: WebSocket, db: AsyncSession = Depends(get_db)):
    await manager.connect(websocket)
    print("📡 WebSocket connected")
    try:
        while True:
            data = await websocket.receive_json()
            event_type = data.get("type", "message")  # default je "message"
            username = data.get("username")

            if event_type == "typing":
                await manager.broadcast({
                    "type": "typing",
                    "username": username,
                })
                continue

            content = data.get("content")
            result = await db.execute(select(User).where(User.username == username))
            user = result.scalar_one_or_none()

            if user:
                message = ChatMessage(user_id=user.id, content=content)
                db.add(message)
                await db.commit()
                await db.refresh(message)

                await manager.broadcast({
                    "type": "message",
                    "username": user.username,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "icon": user.icon,
                    "content": message.content,
                    "timestamp": message.timestamp.isoformat()
                })
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        print("🔌 WebSocket disconnected")

@router.get("/chat/messages")
async def get_all_messages(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ChatMessage).options(selectinload(ChatMessage.user)).order_by(ChatMessage.timestamp)
    )
    messages = result.scalars().all()
    return [
        {
            "username": msg.user.username,
            "first_name": msg.user.first_name,
            "last_name": msg.user.last_name,
            "icon": msg.user.icon,
            "content": msg.content,
            "user_id": msg.user.id,
            "timestamp": msg.timestamp.isoformat()
        }
        for msg in messages
    ]

@router.delete("/chat/messages/{timestamp}")
async def delete_message(timestamp: str, username: str = Query(...), db: AsyncSession = Depends(get_db)):
    try:
        parsed_timestamp = datetime.fromisoformat(timestamp)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid timestamp format")

    result = await db.execute(
        select(ChatMessage)
        .join(ChatMessage.user)
        .where(
            ChatMessage.timestamp == parsed_timestamp,
            User.username == username
        )
    )

    message = result.scalar_one_or_none()

    if not message:
        raise HTTPException(status_code=404, detail="Message not found or not yours.")

    await db.delete(message)
    await db.commit()

    await manager.broadcast({
        "type": "delete",
        "timestamp": timestamp
    })

    return {"detail": "Message deleted."}

class EditMessageData(BaseModel):
    username: str
    new_content: str

@router.put("/chat/messages/{timestamp}")
async def edit_message(timestamp: str, data: EditMessageData, db: AsyncSession = Depends(get_db)):
    try:
        parsed_timestamp = datetime.fromisoformat(timestamp)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid timestamp format")

    result = await db.execute(
        select(ChatMessage)
        .join(ChatMessage.user)
        .where(
            ChatMessage.timestamp == parsed_timestamp,
            User.username == data.username
        )
    )
    message = result.scalar_one_or_none()

    if not message:
        raise HTTPException(status_code=404, detail="Message not found or not yours.")

    message.content = data.new_content + " (edited)"
    await db.commit()
    await db.refresh(message)

    await manager.broadcast({
        "type": "edit",
        "timestamp": timestamp,
        "new_content": message.content,
    })

    return {"detail": "Message updated."}