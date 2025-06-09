#!/usr/bin/env python3
"""
Script to populate the knowledge base with Bookify-specific information
"""

import sys
import os

# Add the parent directory to the path so we can import from services
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.vector_store_service import Document, VectorStoreService

def populate_knowledge_base():
    """Populate the knowledge base with comprehensive Bookify information"""
    
    print("🚀 Populating Bookify knowledge base...")
    
    # Initialize vector store
    vector_store = VectorStoreService()
    
    # Comprehensive knowledge base
    knowledge_items = [
        {
            "content": "Bookify is a comprehensive digital library platform that allows users to discover, read, and discuss books online. The platform features advanced search capabilities, personalized recommendations, community forums, and social reading features.",
            "source": "Platform Overview",
            "category": "general"
        },
        {
            "content": "To search for books on Bookify, use the search bar at the top of any page. You can search by book title, author name, ISBN, genre, or keywords. Use quotes for exact phrases. Advanced filters include publication year, language, rating, availability, and format (digital, audiobook, physical).",
            "source": "Search Guide",
            "category": "search"
        },
        {
            "content": "Creating a Bookify account is free and easy. Click 'Sign Up', provide your email and create a secure password. Verify your email address to activate your account. You can then customize your reading preferences, set privacy settings, and build your personal library.",
            "source": "Account Setup",
            "category": "account"
        },
        {
            "content": "Your Bookify profile showcases your reading journey. Add a profile picture, write a bio, set reading goals, and choose which information to share publicly. You can track books you've read, are currently reading, or want to read.",
            "source": "Profile Management",
            "category": "account"
        },
        {
            "content": "Writing reviews helps the Bookify community discover great books. Rate books from 1-5 stars and write detailed reviews. Be honest, constructive, and avoid major spoilers. You can edit or delete your reviews anytime from your profile.",
            "source": "Review Guidelines",
            "category": "reviews"
        },
        {
            "content": "Bookify's recommendation engine suggests books based on your reading history, ratings, genres you enjoy, and books similar readers liked. The more you rate and review, the better your recommendations become.",
            "source": "Recommendations System",
            "category": "features"
        },
        {
            "content": "Join book discussions in Bookify's community forums. Participate in book clubs, author Q&As, reading challenges, and genre-specific discussions. Follow discussion rules: be respectful, mark spoilers, and stay on topic.",
            "source": "Community Guidelines",
            "category": "community"
        },
        {
            "content": "Organize your books into custom collections and reading lists. Create themed lists like 'Summer Reads', 'Mystery Favorites', or 'To Read Next'. Share your lists with friends or keep them private. Track your reading progress and set annual reading goals.",
            "source": "Collections Guide",
            "category": "features"
        },
        {
            "content": "Bookify offers multiple reading formats: digital ebooks, audio books, and information about physical copies. Some books are available for free, others require purchase or subscription. Check availability and pricing on each book's page.",
            "source": "Reading Formats",
            "category": "reading"
        },
        {
            "content": "Connect with other readers by following users with similar tastes, joining reading groups, and participating in community events. Share your reading updates, see what friends are reading, and get social recommendations.",
            "source": "Social Features",
            "category": "community"
        },
        {
            "content": "Bookify's mobile app syncs with your web account. Read offline, get push notifications for new releases from favorite authors, and access your library anywhere. Available for iOS and Android devices.",
            "source": "Mobile App",
            "category": "technical"
        },
        {
            "content": "Manage your privacy settings to control what information is visible to other users. You can make your reading lists, reviews, and activity private or public. Update settings anytime from your account preferences.",
            "source": "Privacy Settings",
            "category": "account"
        },
        {
            "content": "Authors can create verified profiles on Bookify to connect with readers, share book updates, and participate in community discussions. Authors can host virtual events, answer reader questions, and promote new releases.",
            "source": "Author Features",
            "category": "authors"
        },
        {
            "content": "Having trouble with Bookify? Check our FAQ section, contact support through the help center, or use the live chat feature. Common issues include password resets, account verification, and reading format problems.",
            "source": "Support Options",
            "category": "support"
        },
        {
            "content": "Bookify supports multiple languages and international editions. Change your language preference in account settings. Book availability may vary by region due to publishing rights and licensing agreements.",
            "source": "International Support",
            "category": "technical"
        }
    ]
    
    # Convert to Document objects
    documents = []
    for item in knowledge_items:
        doc = Document(
            page_content=item["content"],
            metadata={
                "source": item["source"],
                "category": item["category"]
            }
        )
        documents.append(doc)
    
    # Add documents to vector store
    vector_store.add_documents(documents)
    
    print(f"✅ Successfully added {len(documents)} knowledge items to the vector store")
    print("📊 Vector store status:", vector_store.get_status())

if __name__ == "__main__":
    populate_knowledge_base()