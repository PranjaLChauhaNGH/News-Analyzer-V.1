# ✅ FIXED: backend/database.py - Resolved SSL and connection issues
from pymongo import MongoClient
from datetime import datetime, timezone, timedelta
import os
from dotenv import load_dotenv
import ssl

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL", "mongodb+srv://xpranjal91:N1Hyz9qLk18ztFlV@cluster0.xnmik2d.mongodb.net/news_analyzer?retryWrites=true&w=majority&ssl=true")
DATABASE_NAME = "news_analyzer"

def connect_to_mongodb():
    """
    FIXED: Establishes connection to MongoDB Atlas with proper error handling
    Removes problematic SSL parameters that cause connection failures
    """
    try:
        # FIXED: Simplified connection parameters without SSL issues
        client = MongoClient(
            MONGO_URL.strip(),
            serverSelectionTimeoutMS=30000,  # 30 second timeout
            connectTimeoutMS=30000,
            socketTimeoutMS=60000,
            maxPoolSize=50,
            minPoolSize=5,
            retryWrites=True,
            # REMOVED: ssl_cert_reqs (this was causing the connection failures)
            tlsAllowInvalidCertificates=False
        )
        
        # Test the connection with a simple ping
        client.admin.command('ping')
        print("✅ MongoDB Atlas cluster connected successfully!")
        print(f"📊 Connected to database: {DATABASE_NAME}")
        print(f"🔗 Cluster: cluster0.xnmik2d.mongodb.net")
        
        db = client[DATABASE_NAME]
        
        # Collections
        users_collection = db.users
        chat_history_collection = db.chat_history
        
        # Create indexes for optimal performance
        create_indexes(users_collection, chat_history_collection)
        
        return client, users_collection, chat_history_collection
        
    except Exception as e:
        print(f"❌ MongoDB Atlas connection failed: {e}")
        print("💡 Troubleshooting tips:")
        print("  1. Check if your cluster is running (not paused)")
        print("  2. Verify IP whitelist includes 0.0.0.0/0")
        print("  3. Confirm password: N1Hyz9qLk18ztFlV")
        print("  4. Check network connectivity")
        
        # FIXED: Don't exit the application, return None to allow graceful degradation
        return None, None, None

def create_indexes(users_collection, chat_history_collection):
    """Create database indexes for optimal query performance"""
    try:
        if users_collection and chat_history_collection:
            # Users collection indexes
            users_collection.create_index("email", unique=True)
            users_collection.create_index("created_at")
            
            # Chat history collection indexes
            chat_history_collection.create_index([("user_id", 1), ("created_at", -1)])
            chat_history_collection.create_index("analysis_type")
            chat_history_collection.create_index("created_at")
            
            print("✅ Database indexes created successfully!")
    except Exception as e:
        print(f"⚠️ Index creation warning: {e}")

def get_database_stats():
    """Get database statistics for monitoring"""
    try:
        if users_collection and chat_history_collection:
            users_count = users_collection.count_documents({})
            chats_count = chat_history_collection.count_documents({})
            
            yesterday = datetime.now(timezone.utc) - timedelta(days=1)
            recent_chats = chat_history_collection.count_documents({
                "created_at": {"$gte": yesterday}
            })
            
            return {
                "total_users": users_count,
                "total_chats": chats_count,
                "recent_chats_24h": recent_chats,
                "database_name": DATABASE_NAME,
                "cluster": "cluster0.xnmik2d.mongodb.net",
                "status": "connected"
            }
    except Exception as e:
        print(f"Error getting database stats: {e}")
    
    return {
        "status": "disconnected",
        "error": "Database not available"
    }

# FIXED: Initialize connection with proper error handling
try:
    client, users_collection, chat_history_collection = connect_to_mongodb()
    if client is None:
        print("⚠️ Starting server without database connection")
except Exception as e:
    print(f"Database initialization error: {e}")
    client = None
    users_collection = None
    chat_history_collection = None
