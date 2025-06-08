from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, Query, Path
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import joinedload, selectinload
from database import get_db
from models.user import ChatMessage, User, PrivateChatMessage
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


class PrivateChatManager:
    def __init__(self):
        self.connections: dict[int, WebSocket] = {}

    async def connect(self, user_id: int, websocket: WebSocket):
        await websocket.accept()
        self.connections[user_id] = websocket

    def disconnect(self, user_id: int):
        if user_id in self.connections:
            del self.connections[user_id]

    async def send_personal_message(self, receiver_id: int, message: dict):
        if receiver_id in self.connections:
            await self.connections[receiver_id].send_json(message)



manager = ConnectionManager()
private_chat_manager = PrivateChatManager()

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

@router.websocket("/ws/private-chat/{user_id}")
async def private_chat(websocket: WebSocket, user_id: int, db: AsyncSession = Depends(get_db)):
    await private_chat_manager.connect(user_id, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            event_type = data.get("type", "message")
            sender_id = data.get("sender_id")
            receiver_id = data.get("receiver_id")

            # 🟨 TIPKANJE
            if event_type == "typing":
                result = await db.execute(select(User).where(User.id == sender_id))
                sender = result.scalar_one_or_none()

                if sender:
                    await private_chat_manager.send_personal_message(receiver_id, {
                        "type": "private_typing",
                        "sender_id": sender_id,
                        "username": sender.username
                    })
                continue

            # 🟩 SLANJE PORUKE
            content = data.get("content")

            msg = PrivateChatMessage(
                sender_id=sender_id,
                receiver_id=receiver_id,
                content=content
            )
            db.add(msg)
            await db.commit()
            await db.refresh(msg)

            result = await db.execute(select(User).where(User.id == sender_id))
            sender = result.scalar_one_or_none()

            if sender:
                message_data = {
                    "type": "private_message",
                    "sender_id": sender_id,
                    "receiver_id": receiver_id,
                    "content": content,
                    "timestamp": msg.timestamp.isoformat(),
                    "message_id": msg.id,
                    "first_name": sender.first_name,
                    "last_name": sender.last_name,
                    "icon": sender.icon
                }

                await private_chat_manager.send_personal_message(sender_id, message_data)
                await private_chat_manager.send_personal_message(receiver_id, message_data)

    except WebSocketDisconnect:
        private_chat_manager.disconnect(user_id)



@router.get("/private-chat/{user1_id}/{user2_id}")
async def get_private_messages(user1_id: int, user2_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(PrivateChatMessage)
        .options(selectinload(PrivateChatMessage.sender))  # Učitaj podatke o senderu
        .where(
            ((PrivateChatMessage.sender_id == user1_id) & (PrivateChatMessage.receiver_id == user2_id)) |
            ((PrivateChatMessage.sender_id == user2_id) & (PrivateChatMessage.receiver_id == user1_id))
        )
        .order_by(PrivateChatMessage.timestamp)
    )
    messages = result.scalars().all()

    return [
        {
            "message_id": m.id,
            "sender_id": m.sender_id,
            "receiver_id": m.receiver_id,
            "content": m.content,
            "timestamp": m.timestamp.isoformat(),
            "first_name": m.sender.first_name,
            "last_name": m.sender.last_name,
            "icon": m.sender.icon
        }
        for m in messages
    ]


@router.delete("/private-chat/messages/{message_id}")
async def delete_private_chat_message(
    message_id: int,
    username: str = Query(...),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(PrivateChatMessage)
        .join(User, PrivateChatMessage.sender_id == User.id)
        .where(PrivateChatMessage.id == message_id, User.username == username)
    )
    message = result.scalar_one_or_none()

    if not message:
        raise HTTPException(status_code=404, detail="Message not found or not yours.")

    sender_id = message.sender_id
    receiver_id = message.receiver_id

    await db.delete(message)
    await db.commit()

    deletion_notice = {
        "type": "private_delete",
        "message_id": message_id
    }

    await private_chat_manager.send_personal_message(sender_id, deletion_notice)
    await private_chat_manager.send_personal_message(receiver_id, deletion_notice)

    return {"detail": "Private message deleted."}

class EditPrivateMessageData(BaseModel):
    username: str
    new_content: str

@router.put("/private-chat/messages/{message_id}")
async def edit_private_message(
    message_id: int,
    data: EditPrivateMessageData,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(PrivateChatMessage)
        .join(User, PrivateChatMessage.sender_id == User.id)
        .where(PrivateChatMessage.id == message_id, User.username == data.username)
    )
    message = result.scalar_one_or_none()

    if not message:
        raise HTTPException(status_code=404, detail="Message not found or not yours.")

    message.content = data.new_content + " (edited)"
    await db.commit()
    await db.refresh(message)

    edit_notice = {
        "type": "private_edit",
        "message_id": message.id,
        "new_content": message.content,
    }

    await private_chat_manager.send_personal_message(message.sender_id, edit_notice)
    await private_chat_manager.send_personal_message(message.receiver_id, edit_notice)

    return {"detail": "Message updated."}