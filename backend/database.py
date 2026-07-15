from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

db_url = os.environ.get("DATABASE_URL")

if db_url and str(db_url).strip() != "":
    db_url = str(db_url).strip().strip('"').strip("'")
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
    engine = create_engine(db_url)
else:
    db_url = "sqlite:///./oppintel.db"
    engine = create_engine(
        db_url, connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
