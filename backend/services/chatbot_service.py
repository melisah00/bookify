import logging
from services.rag_chatbot_service import RagChatbotService

logger = logging.getLogger(__name__)

class ChatbotService:
    """Legacy wrapper for backward compatibility"""
    
    def __init__(self):
        try:
            self.service = RagChatbotService()
        except:
            self.service = None
    
    async def get_response(self, query: str, session_id: str, user_context: dict = None):
        if self.service:
            return await self.service.get_response(query, session_id, user_context)
        return {
            "answer": "Service unavailable",
            "sources": ["System"],
            "confidence": 0.1,
            "suggestions": []
        }
    
    async def get_streaming_response(self, query: str, session_id: str):
        if self.service:
            async for chunk in self.service.get_streaming_response(query, session_id):
                yield chunk
        else:
            yield {"type": "error", "content": "Service unavailable", "finished": True}
    
    async def save_feedback(self, feedback_data: dict):
        if self.service:
            await self.service.save_feedback(feedback_data)