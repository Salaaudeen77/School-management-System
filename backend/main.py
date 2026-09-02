from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from datetime import timedelta
import os

from database import engine, get_db
from models import Base, User
from schemas import UserCreate, UserLogin, Token, UserResponse
from auth import (
    authenticate_user, create_access_token, get_password_hash,
    get_current_active_user, require_admin, ACCESS_TOKEN_EXPIRE_MINUTES
)

# Create tables
Base.metadata.create_all(bind=engine)

# Create uploads directory if it doesn't exist
os.makedirs("uploads", exist_ok=True)

app = FastAPI(
    title="School Management System",
    description="Complete School Management System with Student Photos, Fees, Attendance, and Reports",
    version="1.0.0",
    redirect_slashes=False
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=600,  # Cache preflight requests for 10 minutes
)

# Serve static files (student photos)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Import routers
from routers import classes, students, teachers, parents, fees, attendance, grades, timetable, announcements, reports, promotions, fee_structures
from routers import parent_students
from routers import subjects

app.include_router(students.router, prefix="/api/students", tags=["Students"])
app.include_router(teachers.router, prefix="/api/teachers", tags=["Teachers"])
app.include_router(parents.router, prefix="/api/parents", tags=["Parents"])
app.include_router(fees.router, prefix="/api/fees", tags=["Fees"])
app.include_router(attendance.router, prefix="/api/attendance", tags=["Attendance"])
app.include_router(grades.router, prefix="/api/grades", tags=["Grades"])
app.include_router(timetable.router, prefix="/api/timetable", tags=["Timetable"])
app.include_router(announcements.router, prefix="/api/announcements", tags=["Announcements"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])
app.include_router(parent_students.router, prefix="/api/parent-students", tags=["Parent-Student Links"])
app.include_router(classes.router, prefix="/api/classes", tags=["Classes"])
app.include_router(subjects.router, prefix="/api/subjects", tags=["Subjects"])
app.include_router(promotions.router, prefix="/api/promotions", tags=["Promotions"])
app.include_router(fee_structures.router, prefix="/api/fee-structures", tags=["Fee Structures"])
# Root endpoint
@app.get("/")
def root():
    return {"message": "School Management System API is running", "status": "healthy"}

@app.get("/api/test")
def test():
    return {"message": "API test endpoint working"}

# Authentication endpoints
@app.post("/api/auth/register", response_model=UserResponse)
def register(user: UserCreate, db: Session = Depends(get_db)):
    # Check if user exists
    existing_user = db.query(User).filter(
        (User.username == user.username) | (User.email == user.email)
    ).first()
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Username or email already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user.password)
    db_user = User(
        username=user.username,
        email=user.email,
        password_hash=hashed_password,
        role=user.role,
        full_name=user.full_name,
        phone=user.phone
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.post("/api/auth/login", response_model=Token)
def login(user_data: UserLogin, db: Session = Depends(get_db)):
    user = authenticate_user(db, user_data.username, user_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "full_name": user.full_name,
            "is_active": user.is_active,
            "created_at": user.created_at
        }
    }

@app.get("/api/auth/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_active_user)):
    return current_user

# Health check
@app.get("/api/health")
def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)