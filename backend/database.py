from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

db_url = os.environ.get("DATABASE_URL")

# Fallback if empty or not set
if not db_url or str(db_url).strip() == "":
    db_url = "postgresql://admin:adminpassword@localhost:5432/oppintel"

# Strip accidental quotes from UI copy-pasting
db_url = str(db_url).strip().strip('"').strip("'")

# Fix Railway's postgres:// dialect issue
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

SQLALCHEMY_DATABASE_URL = db_url

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
