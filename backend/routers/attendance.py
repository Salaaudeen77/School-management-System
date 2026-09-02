from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List, Optional
from datetime import date, datetime

from database import get_db
from models import Attendance, Student, Teacher, User
from schemas import AttendanceCreate, AttendanceResponse
from auth import require_teacher, get_current_active_user

router = APIRouter()

@router.get("/")
def get_attendance(
    skip: int = 0,
    limit: int = 100,
    student_id: Optional[int] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    try:
        query = db.query(Attendance).options(joinedload(Attendance.student).joinedload(Student.user))
        
        if student_id:
            query = query.filter(Attendance.student_id == student_id)
        if date_from:
            query = query.filter(Attendance.date >= date_from)
        if date_to:
            query = query.filter(Attendance.date <= date_to)
        
        attendance = query.offset(skip).limit(limit).all()
        
        # Load student names
        result = []
        for record in attendance:
            student = db.query(Student).filter(Student.id == record.student_id).first()
            result.append({
                "id": record.id,
                "student_id": record.student_id,
                "student": student,
                "date": record.date,
                "status": record.status,
                "remarks": record.remarks,
                "created_at": record.created_at
            })
        
        return result
    except Exception as e:
        print(f"Error fetching attendance: {e}")
        return []

@router.get("/count")
def get_attendance_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    count = db.query(Attendance).count()
    return {"count": count}

@router.post("/")
def create_attendance(
    attendance_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    try:
        # Extract data from dict
        student_id = attendance_data.get("student_id")
        date_str = attendance_data.get("date")
        status = attendance_data.get("status", "present")
        remarks = attendance_data.get("remarks", "")
        
        # Validate student exists
        student = db.query(Student).filter(Student.id == student_id).first()
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")
        
        # Check if attendance already exists
        existing = db.query(Attendance).filter(
            Attendance.student_id == student_id,
            Attendance.date == date_str
        ).first()
        
        if existing:
            raise HTTPException(status_code=400, detail="Attendance already recorded for this student on this date")
        
        # Create attendance
        db_attendance = Attendance(
            student_id=student_id,
            date=date_str,
            status=status,
            remarks=remarks
        )
        db.add(db_attendance)
        db.commit()
        db.refresh(db_attendance)
        
        return {
            "id": db_attendance.id,
            "student_id": db_attendance.student_id,
            "date": db_attendance.date,
            "status": db_attendance.status,
            "remarks": db_attendance.remarks,
            "created_at": db_attendance.created_at
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating attendance: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/summary/")
def get_attendance_summary(
    class_name: str = None,
    date_from: date = None,
    date_to: date = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    query = db.query(Attendance)
    
    if class_name:
        query = query.join(Student).filter(Student.class_name == class_name)
    if date_from:
        query = query.filter(Attendance.date >= date_from)
    if date_to:
        query = query.filter(Attendance.date <= date_to)
    
    attendance_records = query.all()
    
    total = len(attendance_records)
    present = len([a for a in attendance_records if a.status == "present"])
    absent = len([a for a in attendance_records if a.status == "absent"])
    late = len([a for a in attendance_records if a.status == "late"])
    
    return {
        "total": total,
        "present": present,
        "absent": absent,
        "late": late,
        "present_percentage": (present / total * 100) if total > 0 else 0
    }

@router.put("/{attendance_id}", response_model=AttendanceResponse)
def update_attendance(
    attendance_id: int,
    attendance: AttendanceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    db_attendance = db.query(Attendance).filter(Attendance.id == attendance_id).first()
    if not db_attendance:
        raise HTTPException(status_code=404, detail="Attendance record not found")
    
    for key, value in attendance.model_dump().items():
        setattr(db_attendance, key, value)
    
    db.commit()
    db.refresh(db_attendance)
    return db_attendance

# ✅ DELETE attendance
@router.delete("/{attendance_id}")
def delete_attendance(
    attendance_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    attendance = db.query(Attendance).filter(Attendance.id == attendance_id).first()
    if not attendance:
        raise HTTPException(status_code=404, detail="Attendance record not found")
    
    db.delete(attendance)
    db.commit()
    return {"message": "Attendance record deleted successfully"}


@router.put("/{attendance_id}", response_model=AttendanceResponse)
def update_attendance(
    attendance_id: int,
    attendance: AttendanceCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_teacher)
):
    db_attendance = db.query(Attendance).filter(Attendance.id == attendance_id).first()
    if not db_attendance:
        raise HTTPException(status_code=404, detail="Attendance record not found")
    
    for key, value in attendance.model_dump().items():
        setattr(db_attendance, key, value)
    
    db.commit()
    db.refresh(db_attendance)
    return db_attendance

def get_teacher_id_from_user(db: Session, user: User):
    """Get teacher_id from user if user is a teacher"""
    if user.role == "teacher":
        teacher = db.query(Teacher).filter(Teacher.user_id == user.id).first()
        if teacher:
            return teacher.id
    return None