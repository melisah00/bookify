from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from services.rag_chatbot_service import RagChatbotService
from models.chatbot_models import ChatMessage, ChatResponse
import json
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/chatbot", tags=["chatbot"])

# Initialize service with error handling
try:
    chatbot_service = RagChatbotService()
    logger.info("✅ Chatbot controller initialized")
except Exception as e:
    logger.error(f"❌ Chatbot controller error: {e}")
    chatbot_service = None

@router.post("/chat", response_model=ChatResponse)
async def chat(message: ChatMessage):
    """Chat endpoint"""
    if not chatbot_service:
        return ChatResponse(
            text="Chatbot service is currently unavailable. Please try again later.",
            sources=["System"],
            confidence=0.1,
            session_id=message.session_id,
            suggestions=["Try again later", "Contact support"]
        )
    
    try:
        response = await chatbot_service.get_response(
            message.text,
            message.session_id,
            message.user_context
        )
        
        return ChatResponse(
            text=response["answer"],
            sources=response["sources"],
            confidence=response["confidence"],
            session_id=message.session_id,
            suggestions=response.get("suggestions", [])
        )
        
    except Exception as e:
        logger.error(f"❌ Chat error: {e}")
        return ChatResponse(
            text="I'm having trouble right now. Please ask about Bookify features like searching books or managing your account.",
            sources=["System"],
            confidence=0.3,
            session_id=message.session_id,
            suggestions=["How do I search books?", "How do I manage my account?"]
        )

@router.post("/chat/stream")
async def chat_stream(message: ChatMessage):
    """Streaming chat endpoint"""
    if not chatbot_service:
        async def error_stream():
            yield "data: {}\n\n".format(json.dumps({
                "type": "error",
                "content": "Service unavailable",
                "finished": True
            }))
        
        return StreamingResponse(error_stream(), media_type="text/event-stream")
    
    async def generate_response():
        try:
            yield "data: {}\n\n".format(json.dumps({"type": "start"}))
            
            async for chunk in chatbot_service.get_streaming_response(
                message.text,
                message.session_id
            ):
                yield f"data: {json.dumps(chunk)}\n\n"
                
        except Exception as e:
            yield "data: {}\n\n".format(json.dumps({
                "type": "error", 
                "content": str(e),
                "finished": True
            }))
        
        yield "data: {}\n\n".format(json.dumps({"type": "end"}))
    
    return StreamingResponse(
        generate_response(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*"
        }
    )

@router.post("/feedback")
async def submit_feedback(feedback_data: dict):
    """Submit feedback"""
    if chatbot_service:
        await chatbot_service.save_feedback(feedback_data)
        return {"status": "success", "message": "Feedback received"}
    return {"status": "error", "message": "Service unavailable"}

@router.get("/health")
async def health_check():
    """Health check"""
    return {
        "status": "healthy" if chatbot_service else "unhealthy",
        "service": "Model-Free RAG Chatbot",
        "ready": chatbot_service is not None
    }

@router.post("/knowledge")
async def add_knowledge(knowledge_data: dict):
    """Add knowledge"""
    if not chatbot_service:
        raise HTTPException(status_code=503, detail="Service unavailable")
    
    content = knowledge_data.get("content", "").strip()
    source = knowledge_data.get("source", "User Input")
    category = knowledge_data.get("category", "general")
    
    if not content or len(content) < 10:
        raise HTTPException(status_code=400, detail="Content too short")
    
    chatbot_service.add_knowledge(content, source, category)
    return {"status": "success", "message": "Knowledge added"}

@router.get("/session/{session_id}/history")
async def get_session_history(session_id: str):
    """Get session history"""
    if not chatbot_service:
        raise HTTPException(status_code=503, detail="Service unavailable")
    
    history = chatbot_service.get_session_history(session_id)
    return {"session_id": session_id, "history": history}

@router.delete("/session/{session_id}")
async def clear_session(session_id: str):
    """Clear session"""
    if not chatbot_service:
        raise HTTPException(status_code=503, detail="Service unavailable")
    
    chatbot_service.clear_session(session_id)
    return {"status": "success", "message": f"Session {session_id} cleared"}