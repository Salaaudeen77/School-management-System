from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
import os
import shutil
from datetime import datetime

from database import get_db
from models import Student, User, Class, StudentClass, Mark, Attendance, Payment, ParentStudent, Promotion
from schemas import StudentCreate, StudentResponse
from auth import require_admin, get_current_active_user

router = APIRouter()

def generate_admission_number(db: Session) -> str:
    """Generate unique admission number: STU-YYYY-XXX"""
    year = datetime.now().year
    latest = db.query(Student).filter(
        Student.admission_number.like(f"STU-{year}-%")
    ).order_by(Student.admission_number.desc()).first()
    
    if latest:
        parts = latest.admission_number.split("-")
        last_num = int(parts[2])
        new_num = last_num + 1
    else:
        new_num = 1
    
    return f"STU-{year}-{str(new_num).zfill(3)}"

@router.get("/", response_model=List[StudentResponse])
def get_students(
    skip: int = 0,
    limit: int = 100,
    class_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(Student)
    
    if class_id:
        query = query.join(StudentClass).filter(
            StudentClass.class_id == class_id,
            StudentClass.is_current == True
        )
    
    students = query.offset(skip).limit(limit).all()

     # Load current class for each student
    for student in students:
        # Get the current class assignment
        current_assignment = db.query(StudentClass).filter(
            StudentClass.student_id == student.id,
            StudentClass.is_current == True
        ).first()
        
        if current_assignment:
            # Load the class object
            student.current_class = db.query(Class).filter(
                Class.id == current_assignment.class_id
            ).first()
        else:
            student.current_class = None
    return students

@router.get("/count")
def get_students_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    count = db.query(Student).count()
    return {"count": count}

@router.post("/", response_model=StudentResponse)
def create_student(
    student: StudentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    # Check if user exists
    user = db.query(User).filter(User.id == student.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Generate admission number
    admission_number = generate_admission_number(db)
    
    # Check if class exists
    cls = db.query(Class).filter(Class.id == student.class_id).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")
    
    # Create student
    db_student = Student(
        user_id=student.user_id,
        admission_number=admission_number,
        date_of_birth=student.date_of_birth,
        gender=student.gender,
        address=student.address,
        grade=student.grade,
        guardian_name=student.guardian_name,
        guardian_phone=student.guardian_phone,
        guardian_email=student.guardian_email
    )
    db.add(db_student)
    db.commit()
    db.refresh(db_student)
    
    # Enroll student in class
    student_class = StudentClass(
        student_id=db_student.id,
        class_id=student.class_id,
        academic_year=student.academic_year,
        is_current=True
    )
    db.add(student_class)
    db.commit()
    
    return db_student

@router.get("/{student_id}", response_model=StudentResponse)
def get_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Load current class
    current_assignment = db.query(StudentClass).filter(
        StudentClass.student_id == student_id,
        StudentClass.is_current == True
    ).first()
    
    if current_assignment:
        student.current_class = db.query(Class).filter(
            Class.id == current_assignment.class_id
        ).first()
    else:
        student.current_class = None
    return student

@router.get("/search/")
def search_students(
    q: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if not q or len(q.strip()) < 2:
        return []
    
    search_term = f"%{q.strip()}%"
    students = db.query(Student).join(User).filter(
        User.full_name.ilike(search_term) | 
        Student.admission_number.ilike(search_term)
    ).options(
        joinedload(Student.user)
    ).all()
    
    # ✅ Load current class for each student
    for student in students:
        current_assignment = db.query(StudentClass).filter(
            StudentClass.student_id == student.id,
            StudentClass.is_current == True
        ).first()
        
        if current_assignment:
            student.current_class = db.query(Class).filter(
                Class.id == current_assignment.class_id
            ).first()
        else:
            student.current_class = None
    
    return students

@router.post("/{student_id}/photo")
def upload_student_photo(
    student_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    os.makedirs("uploads", exist_ok=True)
    
    ext = file.filename.split(".")[-1]
    filename = f"student_{student_id}_{datetime.now().strftime('%Y%m%d%H%M%S')}.{ext}"
    file_path = f"uploads/{filename}"
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    if student.photo:
        old_path = f"uploads/{student.photo}"
        if os.path.exists(old_path):
            os.remove(old_path)
    
    student.photo = filename
    db.commit()
    db.refresh(student)
    
    return {"message": "Photo uploaded successfully", "photo": filename}

@router.put("/{student_id}")
def update_student(
    student_id: int,
    student_update: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    db_student = db.query(Student).filter(Student.id == student_id).first()
    if not db_student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    for key, value in student_update.items():
        if hasattr(db_student, key):
            setattr(db_student, key, value)
    
    db.commit()
    db.refresh(db_student)
    return db_student

@router.delete("/{student_id}")
def delete_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    try:
        user_id = student.user_id
        
        # Delete all related records
        db.query(StudentClass).filter(StudentClass.student_id == student_id).delete()
        db.query(Mark).filter(Mark.student_id == student_id).delete()
        db.query(Attendance).filter(Attendance.student_id == student_id).delete()
        db.query(Payment).filter(Payment.student_id == student_id).delete()
        db.query(ParentStudent).filter(ParentStudent.student_id == student_id).delete()
        db.query(Promotion).filter(Promotion.student_id == student_id).delete()
        
        # Delete the student
        db.delete(student)
        
        # Delete the user account
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            db.delete(user)
        
        db.commit()
        
        return {"message": "Student and user account deleted successfully"}
    except Exception as e:
        db.rollback()
        print(f"Error deleting student: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/class/{class_id}")
def get_students_by_class(
    class_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    cls = db.query(Class).filter(Class.id == class_id).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")
    
    students = db.query(Student).join(StudentClass).filter(
        StudentClass.class_id == class_id,
        StudentClass.is_current == True
    ).all()
    
    return {
        "class": cls,
        "students": students
    }