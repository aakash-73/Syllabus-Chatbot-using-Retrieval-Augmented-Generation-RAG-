import os
import logging
from dotenv import load_dotenv
from mongoengine import connect  # type: ignore
import gridfs  # type: ignore

# Reduce PyMongo debug noise
logging.getLogger("pymongo").setLevel(logging.WARNING)

load_dotenv()

class Config:
    # Prefer MONGO_URI, fallback to MONGODB_URI for backward compatibility
    MONGODB_URI = os.getenv("MONGO_URI") or os.getenv("MONGODB_URI")
    DATABASE_NAME = os.getenv("DATABASE_NAME", "syllabusdb")

db = None
fs = None
CONNECTION_SUCCESS = False

try:
    if not Config.MONGODB_URI:
        raise ValueError("MONGO_URI (or MONGODB_URI) is not set in environment.")

    # `connect` returns a pymongo.MongoClient
    client = connect(Config.DATABASE_NAME, host=Config.MONGODB_URI)

    # Access the DB and init GridFS
    db = client[Config.DATABASE_NAME]
    fs = gridfs.GridFS(db)

    CONNECTION_SUCCESS = True
    print("Successfully connected to MongoDB Atlas.")

except Exception as e:
    print(f"[ERROR] Failed to connect to MongoDB: {e}")
    db, fs = None, None
    CONNECTION_SUCCESS = False
