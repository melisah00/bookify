"""
Data directory initialization
"""
import os

def setup_directories():
    """Create necessary directories"""
    dirs = ["./data", "./data/chroma_db", "./data/knowledge_base"]
    for directory in dirs:
        os.makedirs(directory, exist_ok=True)

setup_directories()