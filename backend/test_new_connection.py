# ✅ FILE: backend/test_new_connection.py
import os
from pymongo import MongoClient
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

# Your new MongoDB URL
MONGO_URL = "mongodb+srv://xpranjal91:N1Hyz9qLk18ztFlV@cluster0.xnmik2d.mongodb.net/news_analyzer?retryWrites=true&w=majority&ssl=true"

print("🧪 Testing News Analyzer Database with New Connection")
print("=" * 60)
print(f"📍 Cluster: cluster0.xnmik2d.mongodb.net")
print(f"👤 Username: xpranjal91")
print(f"🔑 Password: N1Hyz9qLk18ztFlV")
print("=" * 60)

try:
    # Test connection
    client = MongoClient(MONGO_URL, serverSelectionTimeoutMS=30000)
    client.admin.command('ping')
    print("✅ Successfully connected to new MongoDB Atlas cluster!")
    
    # Test database operations
    db = client.news_analyzer
    test_collection = db.test
    
    # Insert test document
    result = test_collection.insert_one({
        "test": "new_connection_test",
        "timestamp": datetime.utcnow(),
        "cluster": "cluster0.xnmik2d.mongodb.net"
    })
    print(f"✅ Test document inserted: {result.inserted_id}")
    
    # Read test document
    doc = test_collection.find_one({"test": "new_connection_test"})
    print(f"✅ Test document retrieved: {doc['timestamp']}")
    
    # Test collections exist
    users_collection = db.users
    chat_history_collection = db.chat_history
    
    users_count = users_collection.count_documents({})
    chats_count = chat_history_collection.count_documents({})
    
    print(f"✅ Database contains {users_count} users and {chats_count} chats")
    
    # Clean up test data
    test_collection.delete_one({"test": "new_connection_test"})
    print("✅ Test data cleaned up")
    
    print("\n🎉 New MongoDB connection is working perfectly!")
    print("🚀 Ready to start your News Analyzer application!")
    
except Exception as e:
    print(f"❌ Connection failed: {e}")
    print("\n💡 Quick fixes:")
    print("1. Verify cluster is running (not paused) in MongoDB Atlas")
    print("2. Check IP whitelist includes 0.0.0.0/0")
    print("3. Confirm password: N1Hyz9qLk18ztFlV")
    print("4. Make sure SSL/TLS is enabled")
