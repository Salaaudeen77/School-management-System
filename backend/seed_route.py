from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db, engine
from models import Base, User
from auth import get_password_hash

router = APIRouter()


@router.get("/run-seed")
def run_seed(db: Session = Depends(get_db)):
    try:
        # 1. Create all tables
        Base.metadata.create_all(bind=engine)
        print("✅ Tables created successfully!")

        # 2. Check if admin user exists
        admin = db.query(User).filter(User.username == "admin").first()

        if not admin:
            # 3. Create the admin user
            admin = User(
                username="admin",
                email="admin@school.com",
                password_hash=get_password_hash("admin123"),
                role="admin",
                full_name="System Administrator",
                is_active=True
            )
            db.add(admin)
            db.commit()
            return {
                "status": "success",
                "message": "Tables created and admin user created!",
                "login": "admin / admin123"
            }
        else:
            return {
                "status": "success",
                "message": "Tables exist and admin user already exists!",
                "login": "admin / admin123"
            }

    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }