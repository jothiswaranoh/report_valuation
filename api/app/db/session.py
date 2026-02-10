from pymongo import MongoClient
import os
from dotenv import load_dotenv
from pathlib import Path

# Load .env from api directory
ENV_PATH = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(ENV_PATH)

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("MONGO_DB_NAME")

if not MONGO_URI or not DB_NAME:
    raise RuntimeError("MONGO_URI or MONGO_DB_NAME not set in .env")

client = MongoClient(MONGO_URI)
db = client[DB_NAME]

# Collections based on schema
users = db["users"]
roles = db["roles"]
user_roles = db["user_roles"]
reports = db["reports"]
original_files = db["original_files"]
ai_extracted_content = db["ai_extracted_content"]
final_reports = db["final_reports"]
banks = db["banks"]

# Legacy collection names (for backward compatibility)
og_files = db["original_files"]
ai_contents = db["ai_extracted_content"]

print(f"MongoDB connected to DB: {DB_NAME}")
