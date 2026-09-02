"""
Run this script once to create an admin user
python backend/seed_admin.py
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, engine
from models import Base, User
from auth import get_password_hash

def create_admin():
    db = SessionLocal()
    
    # Check if admin exists
    admin = db.query(User).filter(User.username == "admin").first()
    if admin:
        print("Admin user already exists!")
        return
    
    # Create admin
    admin = User(
        username="admin",
        email="admin@school.com",
        full_name="System Administrator",
        password_hash=get_password_hash("admin123"),
        role="admin",
        is_active=True
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    print(f"Admin user created successfully!")
    print(f"Username: admin")
    print(f"Password: admin123")
    db.close()

if __name__ == "__main__":
    create_admin()