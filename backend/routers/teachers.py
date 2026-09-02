from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import shutil
from datetime import datetime

from database import get_db
from models import Teacher, User, TeacherSubject
from schemas import TeacherCreate, TeacherResponse
from auth import require_admin, get_current_active_user

def generate_employee_id(db: Session) -> str:
    """
    Generate a unique employee ID in format: TCH-YYYY-XXX
    Example: TCH-2024-001, TCH-2024-002, etc.
    """
    year = datetime.now().year
    
    # Get the latest teacher with employee ID for this year
    latest = db.query(Teacher).filter(
        Teacher.employee_id.like(f"TCH-{year}-%")
    ).order_by(Teacher.employee_id.desc()).first()
    
    if latest:
        # Extract the number part and increment
        parts = latest.employee_id.split("-")
        last_num = int(parts[2])
        new_num = last_num + 1
    else:
        new_num = 1
    
    return f"TCH-{year}-{str(new_num).zfill(3)}"

router = APIRouter()

@router.get("/", response_model=List[TeacherResponse])
def get_teachers(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    teachers = db.query(Teacher).offset(skip).limit(limit).all()
    return teachers

@router.get("/count")
def get_teachers_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    count = db.query(Teacher).count()
    return {"count": count}

@router.get("/{teacher_id}", response_model=TeacherResponse)
def get_teacher(
    teacher_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    return teacher

@router.post("/", response_model=TeacherResponse)
def create_teacher(
    teacher: TeacherCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    # Check if user exists
    user = db.query(User).filter(User.id == teacher.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # 🔥 Auto-generate employee ID if not provided
    if not teacher.employee_id or teacher.employee_id == "":
        teacher.employee_id = generate_employee_id(db)
    
    # Check if employee ID is unique
    existing = db.query(Teacher).filter(Teacher.employee_id == teacher.employee_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Employee ID already exists")

    db_teacher = Teacher(
        user_id=teacher.user_id,
        employee_id=teacher.employee_id,
        subject=teacher.subject,  # ✅ This should be saved
        qualification=teacher.qualification,
        experience=teacher.experience,
        hire_date=teacher.hire_date,
        department=teacher.department
    )
    
    db_teacher = Teacher(**teacher.model_dump())
    db.add(db_teacher)
    db.commit()
    db.refresh(db_teacher)
    return db_teacher

@router.put("/{teacher_id}", response_model=TeacherResponse)
def update_teacher(
    teacher_id: int,
    teacher: TeacherCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    db_teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    if not db_teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    for key, value in teacher.model_dump().items():
        setattr(db_teacher, key, value)
    
    db.commit()
    db.refresh(db_teacher)
    return db_teacher

@router.delete("/{teacher_id}")
def delete_teacher(
    teacher_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    try:
        user_id = teacher.user_id
        
        # Delete teacher-subject assignments
        db.query(TeacherSubject).filter(TeacherSubject.teacher_id == teacher_id).delete()
        
        # Delete the teacher
        db.delete(teacher)
        
        # Delete the user account
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            db.delete(user)
        
        db.commit()
        
        return {"message": "Teacher and user account deleted successfully"}
    except Exception as e:
        db.rollback()
        print(f"Error deleting teacher: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{teacher_id}/photo")
def upload_teacher_photo(
    teacher_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    os.makedirs("uploads", exist_ok=True)
    
    ext = file.filename.split(".")[-1]
    filename = f"teacher_{teacher_id}_{datetime.now().strftime('%Y%m%d%H%M%S')}.{ext}"
    file_path = f"uploads/{filename}"
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    if teacher.photo:
        old_path = f"uploads/{teacher.photo}"
        if os.path.exists(old_path):
            os.remove(old_path)
    
    teacher.photo = filename
    db.commit()
    db.refresh(teacher)
    
    return {"message": "Photo uploaded successfully", "photo": filename}