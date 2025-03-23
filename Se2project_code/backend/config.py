import os
import logging
from mongoengine import connect # type: ignore
import gridfs # type: ignore

# Set logging level to reduce PyMongo debug noise
logging.getLogger("pymongo").setLevel(logging.WARNING)

class Config:
    # MongoDB connection URI with improved settings
    MONGODB_URI = os.getenv(
        "MONGODB_URI",
        "mongodb+srv://reddyaakash0702:JUTOEc16xfmEgk7f@cluster0.h8hzh.mongodb.net/syllabusdb?"
        "retryWrites=true&tls=true&tlsAllowInvalidCertificates=true&serverSelectionTimeoutMS=5000"
    )
    DATABASE_NAME = os.getenv("DATABASE_NAME", "syllabusdb")

try:
    # Establish a connection to MongoDB Atlas with explicit TLS options
    client = connect(Config.DATABASE_NAME, host=Config.MONGODB_URI)
    print("Successfully connected to MongoDB Atlas.")
    
    # Access the database and initialize GridFS
    db = client[Config.DATABASE_NAME]
    fs = gridfs.GridFS(db)
    CONNECTION_SUCCESS = True

except Exception as e:
    # Log the error and set connection objects to None
    print(f"[ERROR] Failed to connect to MongoDB: {e}")
    db, fs = None, None
    CONNECTION_SUCCESS = False
