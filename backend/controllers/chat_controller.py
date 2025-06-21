import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, Query, Path
from sqlalchemy import func
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
        await self.broadcast_online_users()

    def disconnect(self, user_id: int):
        if user_id in self.connections:
            del self.connections[user_id]
        asyncio.create_task(self.broadcast_online_users())

    async def send_personal_message(self, receiver_id: int, message: dict):
        if receiver_id in self.connections:
            await self.connections[receiver_id].send_json(message)

    # ✅ OVO je funkcija koja je pukla
    async def broadcast_online_users(self):
        user_ids = list(self.connections.keys())
        for conn in self.connections.values():
            await conn.send_json({
                "type": "online_users",
                "user_ids": user_ids
            })




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
    # 1. Dohvati sve poruke između ova dva korisnika
    result = await db.execute(
        select(PrivateChatMessage)
        .options(selectinload(PrivateChatMessage.sender))
        .where(
            ((PrivateChatMessage.sender_id == user1_id) & (PrivateChatMessage.receiver_id == user2_id)) |
            ((PrivateChatMessage.sender_id == user2_id) & (PrivateChatMessage.receiver_id == user1_id))
        )
        .order_by(PrivateChatMessage.timestamp)
    )
    messages = result.scalars().all()

    # 2. Označi poruke koje su POSLANE KA user1_id kao pročitane
    count_updated = False
    for msg in messages:
        if msg.receiver_id == user1_id and not msg.is_read:
            msg.is_read = True
            count_updated = True

    if count_updated:
        await db.commit()

        # 🔁 Pošalji WebSocket poruku da su sve poruke od user2_id prema user1_id pročitane
        await private_chat_manager.send_personal_message(user1_id, {
            "type": "unread_count_update",
            "sender_id": user2_id,  # onaj ko je slao poruke
            "count": 0
        })

    # 3. Vrati formatirane poruke
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
    

@router.get("/chat/inbox/{user_id}")
async def get_inbox_users(user_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(PrivateChatMessage)
        .where(
            (PrivateChatMessage.sender_id == user_id) |
            (PrivateChatMessage.receiver_id == user_id)
        )
        .order_by(PrivateChatMessage.timestamp.desc())
    )
    messages = result.scalars().all()

    latest_per_user = {}
    for msg in messages:
        other_id = msg.receiver_id if msg.sender_id == user_id else msg.sender_id
        if other_id not in latest_per_user:
            latest_per_user[other_id] = msg

    users_result = await db.execute(
        select(User).where(User.id.in_(latest_per_user.keys()))
    )
    users = users_result.scalars().all()
    user_map = {u.id: u for u in users}

    # 🆕 Prebroj nepročitane poruke
    unread_counts_result = await db.execute(
        select(PrivateChatMessage.sender_id, func.count())
        .where(PrivateChatMessage.receiver_id == user_id, PrivateChatMessage.is_read == False)
        .group_by(PrivateChatMessage.sender_id)
    )
    unread_map = {sender_id: count for sender_id, count in unread_counts_result.all()}

    return [
        {
            "id": uid,
            "username": user_map[uid].username,
            "first_name": user_map[uid].first_name,
            "last_name": user_map[uid].last_name,
            "icon": user_map[uid].icon,
            "last_message": latest_per_user[uid].content,
            "last_time": latest_per_user[uid].timestamp.isoformat(),
            "unread_count": unread_map.get(uid, 0),  # 🆕 Dodano ovdje
        }
        for uid in latest_per_user
    ]
