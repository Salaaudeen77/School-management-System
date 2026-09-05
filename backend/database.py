from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from decouple import config

DATABASE_URL = config("DATABASE_URL")

# For Aiven MySQL with SSL
engine = create_engine(
    DATABASE_URL,
    connect_args={
        "ssl": {
            "ssl-ca": "/path/to/ca.pem"  # Download from Aiven
        }
    } if "aivencloud.com" in DATABASE_URL else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()