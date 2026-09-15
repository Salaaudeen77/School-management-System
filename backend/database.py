from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from decouple import config
import os

DATABASE_URL = config("DATABASE_URL")

# Configure SSL for Aiven
connect_args = {}
if "aivencloud.com" in DATABASE_URL:
    connect_args = {
        "ssl": {
            "ca": "ca.pem"  # This must match the Secret File name
        }
    }

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()