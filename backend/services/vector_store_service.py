# import numpy as np
import json
import os
import re
from typing import List, Dict, Optional
import pickle
import asyncio
from collections import Counter
from math import sqrt

class Document:
    def __init__(self, page_content: str, metadata: Dict = None):
        self.page_content = page_content
        self.metadata = metadata or {}

class VectorStoreService:
    def __init__(self):
        print("🔧 Initializing Model-Free Vector Store...")
        
        self.documents = []
        self.vector_db_path = "./data/vector_db"
        
        # Create directories
        os.makedirs(self.vector_db_path, exist_ok=True)
        os.makedirs("./data/knowledge_base", exist_ok=True)
        
        # Initialize knowledge base
        self._initialize_knowledge_base()
        
        # Try to load existing documents
        self._load_existing_documents()
        
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
        
        print("✅ Model-Free Vector Store initialized")
    
    def _load_existing_documents(self):
        """Try to load existing documents"""
        docs_file = os.path.join(self.vector_db_path, "documents.pkl")
        
        if os.path.exists(docs_file):
            try:
                with open(docs_file, 'rb') as f:
                    saved_docs = pickle.load(f)
                    # Only add if we don't already have documents
                    if not self.documents:
                        self.documents = saved_docs
                        print(f"✅ Loaded {len(self.documents)} existing documents")
                        return True
            except Exception as e:
                print(f"⚠️ Could not load existing documents: {e}")
        
        return False
    
    def _initialize_knowledge_base(self):
        """Initialize with comprehensive Bookify knowledge"""
        knowledge_items = [
            {
                "content": "Bookify is a comprehensive digital library platform that allows users to discover, read, and discuss books online. The platform features advanced search capabilities, personalized recommendations, community forums, and social reading features for book lovers worldwide.",
                "source": "Platform Overview"
            },
            {
                "content": "To search for books on Bookify, use the search bar at the top of any page. You can search by book title, author name, ISBN, genre, or keywords. Use quotes for exact phrases like \"Harry Potter\". Advanced filters include publication year, language, rating, availability, and format (digital, audiobook, physical copy).",
                "source": "Search Guide"
            },
            {
                "content": "Creating a Bookify account is free and easy. Click the 'Sign Up' button, provide your email address and create a secure password. You'll receive a verification email to activate your account. Once verified, customize your reading preferences, set privacy settings, and start building your personal library.",
                "source": "Account Setup"
            },
            {
                "content": "Your Bookify profile showcases your reading journey and connects you with fellow readers. Add a profile picture, write an engaging bio, set annual reading goals, and choose which information to share publicly. Track books you've read, are currently reading, or want to read in the future.",
                "source": "Profile Management"
            },
            {
                "content": "Writing reviews on Bookify helps the community discover great books and avoid disappointing ones. Rate books from 1-5 stars and write detailed, honest reviews. Be constructive in criticism and avoid major spoilers. You can edit or delete your reviews anytime from your profile page.",
                "source": "Review Guidelines"
            },
            {
                "content": "Bookify's smart recommendation engine suggests books based on your reading history, ratings, preferred genres, and books that similar readers enjoyed. The more you rate and review books, the more accurate and personalized your recommendations become over time.",
                "source": "Recommendations System"
            },
            {
                "content": "Join vibrant book discussions in Bookify's community forums. Participate in book clubs, author Q&A sessions, reading challenges, and genre-specific discussions. Follow community guidelines: be respectful, mark spoilers clearly, stay on topic, and welcome new members warmly.",
                "source": "Community Guidelines"
            },
            {
                "content": "Organize your books into custom collections and themed reading lists. Create lists like 'Summer Beach Reads', 'Mystery Favorites', 'Books to Read Next', or 'Classics Challenge'. Share your curated lists with friends or keep them private. Track reading progress and set goals.",
                "source": "Collections Guide"
            },
            {
                "content": "Bookify offers multiple reading formats to suit your preferences: digital ebooks for immediate access, audiobooks for hands-free listening, and information about physical copies for traditional reading. Some books are free, others require purchase or subscription access.",
                "source": "Reading Formats"
            },
            {
                "content": "Connect with fellow book lovers by following users with similar reading tastes, joining active reading groups, and participating in community events. Share your reading updates, discover what friends are currently reading, and receive social recommendations from trusted sources.",
                "source": "Social Features"
            },
            {
                "content": "Bookify's mobile app seamlessly syncs with your web account across all devices. Read offline during commutes, receive push notifications for new releases from favorite authors, and access your entire library anywhere. Available for both iOS and Android devices.",
                "source": "Mobile App"
            },
            {
                "content": "Manage your privacy settings to control what information other users can see about your reading activity. Make your reading lists, reviews, and activity feed either public or private. Update these settings anytime from your account preferences page.",
                "source": "Privacy Settings"
            },
            {
                "content": "Authors can create verified profiles on Bookify to connect directly with their readers, share exciting book updates, and participate in community discussions. Host virtual book launch events, answer reader questions in real-time, and promote upcoming releases to engaged audiences.",
                "source": "Author Features"
            },
            {
                "content": "Need help with Bookify? Check our comprehensive FAQ section, contact our friendly support team through the help center, or use the live chat feature for immediate assistance. Common topics include password resets, account verification, and troubleshooting reading format issues.",
                "source": "Support Options"
            },
            {
                "content": "Bookify supports multiple languages and international book editions to serve our global community. Change your preferred language in account settings. Note that book availability may vary by geographic region due to publishing rights and licensing agreements.",
                "source": "International Support"
            }
        ]
        
        # Only initialize if we don't have documents yet
        if not self.documents:
            for item in knowledge_items:
                doc = Document(
                    page_content=item["content"],
                    metadata={"source": item["source"]}
                )
                self.documents.append(doc)
            
            print(f"✅ Initialized knowledge base with {len(self.documents)} documents")
    
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
    
    async def similarity_search(self, query: str, k: int = 3) -> List[Document]:
        """Search for similar documents using TF-IDF similarity"""
        if not self.documents:
            return []
        
        # Extract keywords from query
        query_keywords = self._extract_keywords(query)
        
        if not query_keywords:
            return self._keyword_search(query, k)
        
        # Calculate similarity scores for all documents
        scored_docs = []
        
        for doc in self.documents:
            doc_keywords = self._extract_keywords(doc.page_content)
            similarity = self._calculate_tf_idf_similarity(query_keywords, doc_keywords)
            
            if similarity > 0.05:  # Minimum similarity threshold
                scored_docs.append((similarity, doc))
        
        # Sort by similarity score (descending) and return top k
        scored_docs.sort(reverse=True, key=lambda x: x[0])
        
        # Return top k documents
        result_docs = [doc for _, doc in scored_docs[:k]]
        
        # If no good matches, fall back to keyword search
        if not result_docs:
            result_docs = self._keyword_search(query, k)
        
        return result_docs
    
    def _keyword_search(self, query: str, k: int = 3) -> List[Document]:
        """Fallback keyword-based search"""
        query_words = set(query.lower().split())
        
        # Score documents based on keyword overlap
        scored_docs = []
        for doc in self.documents:
            content_words = set(doc.page_content.lower().split())
            score = len(query_words.intersection(content_words))
            
            if score > 0:
                scored_docs.append((score, doc))
        
        # Sort by score and return top k
        scored_docs.sort(reverse=True, key=lambda x: x[0])
        return [doc for _, doc in scored_docs[:k]]
    
    def add_documents(self, new_documents: List[Document]):
        """Add new documents to the vector store"""
        if not new_documents:
            return
        
        print(f"📝 Adding {len(new_documents)} new documents...")
        
        # Add to document list
        self.documents.extend(new_documents)
        
        # Save updated document list
        docs_file = os.path.join(self.vector_db_path, "documents.pkl")
        with open(docs_file, 'wb') as f:
            pickle.dump(self.documents, f)
        
        print(f"✅ Added {len(new_documents)} new documents to vector store")
    
    def get_status(self) -> Dict:
        """Get vector store status"""
        return {
            "total_documents": len(self.documents),
            "search_method": "TF-IDF + Keyword Search",
            "model_free": True,
            "ready": True
        }