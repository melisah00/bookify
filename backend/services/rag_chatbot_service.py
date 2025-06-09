import asyncio
import json
import logging
import os
import pickle
import re
import time
from collections import Counter, defaultdict
from datetime import datetime
from typing import Dict, List, Optional, AsyncGenerator
from math import sqrt

from services.vector_store_service import VectorStoreService, Document

logger = logging.getLogger(__name__)

class RagChatbotService:
    """Model-free RAG chatbot service using rule-based NLP and TF-IDF"""
    
    def __init__(self):
        logger.info("🚀 Initializing Model-Free RAG Chatbot Service...")
        
        # Initialize components
        self.vector_store = VectorStoreService()
        self.sessions = {}  # Store conversation history
        self.feedback_data = []
        
        # Response templates
        self.response_templates = self._initialize_response_templates()
        
        # Intent patterns
        self.intent_patterns = self._initialize_intent_patterns()
        
        # Common words to filter out (stop words)
        self.stop_words = {
            'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours',
            'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', 'her', 'hers',
            'herself', 'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves',
            'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'am', 'is', 'are',
            'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does',
            'did', 'doing', 'a', 'an', 'the', 'and', 'but', 'if', 'or', 'because', 'as', 'until',
            'while', 'of', 'at', 'by', 'for', 'with', 'through', 'during', 'before', 'after',
            'above', 'below', 'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under', 'again',
            'further', 'then', 'once', 'can', 'could', 'would', 'should'
        }
        
        logger.info("✅ Model-Free RAG Chatbot Service initialized")
    
    def _initialize_response_templates(self) -> Dict[str, List[str]]:
        """Initialize response templates for different intents"""
        return {
            'search': [
                "To search for books on Bookify, use the search bar at the top of the page. You can search by {context}.",
                "Here's how to find books on Bookify: {context}",
                "For searching books, {context}"
            ],
            'account': [
                "Regarding your Bookify account: {context}",
                "For account management on Bookify: {context}",
                "Here's what you need to know about accounts: {context}"
            ],
            'reviews': [
                "About writing reviews on Bookify: {context}",
                "For book reviews: {context}",
                "Here's how reviews work: {context}"
            ],
            'features': [
                "Bookify offers these features: {context}",
                "Here's what you can do on Bookify: {context}",
                "About Bookify's capabilities: {context}"
            ],
            'community': [
                "Regarding Bookify's community features: {context}",
                "For community interaction: {context}",
                "About connecting with other readers: {context}"
            ],
            'support': [
                "For help with Bookify: {context}",
                "If you need assistance: {context}",
                "Here's how to get support: {context}"
            ],
            'general': [
                "About Bookify: {context}",
                "Here's what I can tell you: {context}",
                "Regarding your question: {context}"
            ]
        }
    
    def _initialize_intent_patterns(self) -> Dict[str, List[str]]:
        """Initialize patterns for intent recognition"""
        return {
            'search': [
                'search', 'find', 'look', 'discover', 'browse', 'explore', 'locate', 'book', 'books', 'title', 'author', 'genre'
            ],
            'account': [
                'account', 'profile', 'register', 'sign up', 'login', 'password', 'email', 'verification', 'settings'
            ],
            'reviews': [
                'review', 'rating', 'rate', 'stars', 'feedback', 'opinion', 'comment', 'recommend'
            ],
            'features': [
                'features', 'capabilities', 'functions', 'tools', 'options', 'services', 'platform'
            ],
            'community': [
                'community', 'forum', 'discussion', 'social', 'friends', 'follow', 'group', 'club', 'connect'
            ],
            'support': [
                'help', 'support', 'problem', 'issue', 'trouble', 'error', 'bug', 'assistance', 'contact'
            ]
        }
    
    def _extract_keywords(self, text: str) -> List[str]:
        """Extract meaningful keywords from text"""
        # Convert to lowercase and remove punctuation
        text = re.sub(r'[^\w\s]', ' ', text.lower())
        words = text.split()
        
        # Filter out stop words and short words
        keywords = [word for word in words if word not in self.stop_words and len(word) > 2]
        
        return keywords
    
    def _calculate_tf_idf_similarity(self, query_keywords: List[str], doc_keywords: List[str]) -> float:
        """Calculate TF-IDF-like similarity between query and document keywords"""
        if not query_keywords or not doc_keywords:
            return 0.0
        
        # Create word frequency counts
        query_freq = Counter(query_keywords)
        doc_freq = Counter(doc_keywords)
        
        # Get all unique words
        all_words = set(query_keywords + doc_keywords)
        
        # Calculate similarity using cosine similarity of frequency vectors
        dot_product = sum(query_freq[word] * doc_freq[word] for word in all_words)
        
        query_magnitude = sqrt(sum(freq ** 2 for freq in query_freq.values()))
        doc_magnitude = sqrt(sum(freq ** 2 for freq in doc_freq.values()))
        
        if query_magnitude == 0 or doc_magnitude == 0:
            return 0.0
        
        return dot_product / (query_magnitude * doc_magnitude)
    
    def _detect_intent(self, query: str) -> str:
        """Detect the intent of the user query"""
        query_lower = query.lower()
        intent_scores = {}
        
        for intent, patterns in self.intent_patterns.items():
            score = sum(1 for pattern in patterns if pattern in query_lower)
            if score > 0:
                intent_scores[intent] = score
        
        if intent_scores:
            return max(intent_scores, key=intent_scores.get)
        
        return 'general'
    
    def _generate_response_from_context(self, query: str, relevant_docs: List[Document], intent: str) -> str:
        """Generate response using templates and context"""
        if not relevant_docs:
            return self._generate_fallback_response(query, intent)
        
        # Extract context from most relevant document
        best_doc = relevant_docs[0]
        context = best_doc.page_content
        
        # Truncate context if too long
        if len(context) > 200:
            sentences = context.split('.')
            context = '. '.join(sentences[:2]) + '.'
        
        # Select appropriate template
        templates = self.response_templates.get(intent, self.response_templates['general'])
        template = templates[0]  
        
        # Fill template with context
        response = template.format(context=context)
        
        # Clean up the response
        response = self._clean_response(response)
        
        return response
    
    def _generate_fallback_response(self, query: str, intent: str) -> str:
        """Generate fallback response when no relevant documents found"""
        fallback_responses = {
            'search': "To search for books on Bookify, use the search bar at the top of the page. You can search by title, author, genre, or keywords. Advanced filters help narrow your results by publication year, rating, and language.",
            
            'account': "You can create a Bookify account by clicking 'Sign Up' and providing your email address. After email verification, you can customize your profile, set reading preferences, and start building your personal library.",
            
            'reviews': "To write a review on Bookify, go to any book page and click 'Write Review'. Rate the book from 1-5 stars and share your honest thoughts. Keep reviews constructive and spoiler-free to help other readers.",
            
            'features': "Bookify offers book search and discovery, personalized recommendations, community forums, reading lists, author events, and social features to connect with fellow readers who share your interests.",
            
            'community': "Join Bookify's community through book discussion forums, reading groups, and author events. You can follow other readers, share your reading updates, and participate in reading challenges.",
            
            'support': "For help with Bookify, check our FAQ section, contact support through the help center, or use the live chat feature. Common topics include account setup, password resets, and reading features.",
            
            'general': "Bookify is a digital library platform where you can discover, read, and discuss books with a community of readers. You can search books, write reviews, join discussions, and get personalized recommendations."
        }
        
        return fallback_responses.get(intent, fallback_responses['general'])
    
    def _clean_response(self, response: str) -> str:
        """Clean up the generated response"""
        # Remove extra whitespace
        response = ' '.join(response.split())
        
        # Ensure proper sentence ending
        if response and not response.endswith(('.', '!', '?')):
            response += '.'
        
        # Capitalize first letter
        if response:
            response = response[0].upper() + response[1:]
        
        return response
    
    async def get_response(self, query: str, session_id: str, user_context: Dict = None) -> Dict:
        """Get response using model-free RAG approach"""
        try:
            # Extract keywords from query
            query_keywords = self._extract_keywords(query)
            
            # Get relevant context from vector store using keyword-based similarity
            relevant_docs = await self.vector_store.similarity_search(query, k=2)
            
            # Detect intent
            intent = self._detect_intent(query)
            
            # Generate response
            response_text = self._generate_response_from_context(query, relevant_docs, intent)
            
            # Calculate confidence based on keyword matches and context relevance
            confidence = self._calculate_confidence(query_keywords, relevant_docs, intent)
            
            # Extract sources
            sources = [doc.metadata.get("source", "Bookify Knowledge Base") for doc in relevant_docs] if relevant_docs else ["Bookify Knowledge Base"]
            
            # Generate suggestions
            suggestions = self._generate_suggestions(intent, user_context)
            
            # Store in session history
            self._update_session_history(session_id, query, response_text)
            
            return {
                "answer": response_text,
                "sources": sources,
                "confidence": confidence,
                "suggestions": suggestions
            }
            
        except Exception as e:
            logger.error(f"❌ Error generating response: {e}")
            return {
                "answer": "I'm here to help with Bookify! You can ask about searching for books, managing your account, writing reviews, or using community features.",
                "sources": ["System"],
                "confidence": 0.3,
                "suggestions": ["How do I search for books?", "How do I create an account?", "How do I write a review?"]
            }
    
    def _calculate_confidence(self, query_keywords: List[str], relevant_docs: List[Document], intent: str) -> float:
        """Calculate confidence score based on keyword matches and context"""
        base_confidence = 0.4
        
        # Boost confidence if we have relevant documents
        if relevant_docs:
            base_confidence += 0.3
            
            # Additional boost based on keyword similarity
            best_doc = relevant_docs[0]
            doc_keywords = self._extract_keywords(best_doc.page_content)
            similarity = self._calculate_tf_idf_similarity(query_keywords, doc_keywords)
            base_confidence += similarity * 0.3
        
        # Boost confidence for well-recognized intents
        if intent != 'general':
            base_confidence += 0.1
        
        return min(base_confidence, 1.0)
    
    def _generate_suggestions(self, intent: str, user_context: Dict = None) -> List[str]:
        """Generate follow-up suggestions based on intent"""
        suggestions_map = {
            'search': [
                "How do I use advanced search filters?",
                "Can I search by genre or author?",
                "How do I save my search results?"
            ],
            'account': [
                "How do I update my profile?",
                "Can I change my password?",
                "How do I manage my reading preferences?"
            ],
            'reviews': [
                "How do I edit my reviews?",
                "Can I see all my reviews?",
                "How do book ratings work?"
            ],
            'features': [
                "What are Bookify's main features?",
                "How do recommendations work?",
                "Can I create reading lists?"
            ],
            'community': [
                "How do I join book discussions?",
                "Can I follow other readers?",
                "Are there reading groups I can join?"
            ],
            'support': [
                "How do I contact support?",
                "Where can I find help articles?",
                "How do I report a problem?"
            ]
        }
        
        return suggestions_map.get(intent, [
            "How do I search for books?",
            "How do I create an account?",
            "What features does Bookify offer?"
        ])
    
    def _update_session_history(self, session_id: str, user_message: str, bot_response: str):
        """Update conversation history"""
        if session_id not in self.sessions:
            self.sessions[session_id] = []
        
        self.sessions[session_id].append({
            "user": user_message,
            "assistant": bot_response,
            "timestamp": datetime.now().isoformat()
        })
        
        # Keep only last 10 exchanges
        if len(self.sessions[session_id]) > 10:
            self.sessions[session_id] = self.sessions[session_id][-10:]
    
    async def get_streaming_response(self, query: str, session_id: str) -> AsyncGenerator[Dict, None]:
        """Get streaming response for real-time chat"""
        try:
            yield {"type": "start", "content": ""}
            
            # Get response
            response = await self.get_response(query, session_id)
            
            # Simulate streaming by sending word by word
            words = response["answer"].split()
            current_response = ""
            
            for word in words:
                current_response += word + " "
                yield {
                    "type": "token",
                    "content": word,
                    "partial_response": current_response.strip()
                }
                await asyncio.sleep(0.03)  # Small delay for streaming effect
            
            yield {
                "type": "complete",
                "content": response["answer"],
                "sources": response["sources"],
                "confidence": response["confidence"],
                "suggestions": response["suggestions"]
            }
            
        except Exception as e:
            yield {
                "type": "error",
                "content": f"I'm having trouble right now. Please try asking about Bookify features.",
                "finished": True
            }
    
    async def save_feedback(self, feedback_data: dict):
        """Save user feedback"""
        feedback_entry = {
            "timestamp": datetime.now().isoformat(),
            "session_id": feedback_data.get("session_id"),
            "message_id": feedback_data.get("message_id"),
            "rating": feedback_data.get("rating"),
            "comment": feedback_data.get("comment", ""),
            "helpful": feedback_data.get("helpful")
        }
        
        self.feedback_data.append(feedback_entry)
        
        # Save to file
        os.makedirs("./data/feedback", exist_ok=True)
        with open("./data/feedback/chatbot_feedback.json", "w") as f:
            json.dump(self.feedback_data, f, indent=2)
    
    def add_knowledge(self, content: str, source: str, category: str = "general"):
        """Add new knowledge to the vector store"""
        doc = Document(
            page_content=content,
            metadata={
                "source": source,
                "category": category,
                "timestamp": datetime.now().isoformat()
            }
        )
        
        self.vector_store.add_documents([doc])
    
    def get_session_history(self, session_id: str) -> List[Dict]:
        """Get conversation history for a session"""
        return self.sessions.get(session_id, [])
    
    def clear_session(self, session_id: str):
        """Clear conversation history for a session"""
        if session_id in self.sessions:
            del self.sessions[session_id]
    
    def get_status(self) -> Dict:
        """Get service status"""
        return {
            "service_type": "Model-Free RAG",
            "algorithm": "TF-IDF + Rule-Based",
            "vector_store_status": self.vector_store.get_status(),
            "active_sessions": len(self.sessions),
            "total_feedback": len(self.feedback_data),
            "response_templates": len(self.response_templates),
            "intent_patterns": len(self.intent_patterns)
        }