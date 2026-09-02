from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import date

from database import get_db
from models import Student, Teacher, Payment, Attendance, Mark, User
from auth import require_admin, get_current_active_user

router = APIRouter()

@router.get("/students")
def get_student_report(
    class_name: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    query = db.query(Student)
    
    if class_name:
        query = query.filter(Student.class_name == class_name)
    
    students = query.all()
    
    return {
        "total_students": len(students),
        "by_class": get_students_by_class(students),
        "students": students
    }

@router.get("/teachers")
def get_teacher_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    teachers = db.query(Teacher).all()
    
    return {
        "total_teachers": len(teachers),
        "teachers": teachers
    }

@router.get("/fees")
def get_fee_report(
    term: Optional[str] = None,
    class_name: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    query = db.query(Payment)
    
    if term:
        query = query.filter(Payment.term == term)
    if class_name:
        query = query.join(Student).filter(Student.class_name == class_name)
    
    payments = query.all()
    
    total_amount = sum(p.amount for p in payments)
    total_paid = sum(p.amount_paid for p in payments)
    total_pending = total_amount - total_paid
    
    return {
        "total_amount": total_amount,
        "total_paid": total_paid,
        "total_pending": total_pending,
        "payments": payments
    }

@router.get("/attendance")
def get_attendance_report(
    date_from: date,
    date_to: date,
    class_name: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    query = db.query(Attendance).filter(
        Attendance.date >= date_from,
        Attendance.date <= date_to
    )
    
    if class_name:
        query = query.join(Student).filter(Student.class_name == class_name)
    
    attendance = query.all()
    
    total = len(attendance)
    present = len([a for a in attendance if a.status == "present"])
    absent = len([a for a in attendance if a.status == "absent"])
    late = len([a for a in attendance if a.status == "late"])
    
    return {
        "total": total,
        "present": present,
        "absent": absent,
        "late": late,
        "present_percentage": (present / total * 100) if total > 0 else 0
    }

@router.get("/grades")
def get_grade_report(
    term: str,
    class_name: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    query = db.query(Mark).filter(Mark.term == term)
    
    if class_name:
        query = query.join(Student).filter(Student.class_name == class_name)
    
    marks = query.all()
    
    subject_averages = {}
    for mark in marks:
        if mark.subject_id not in subject_averages:
            subject_averages[mark.subject_id] = []
        subject_averages[mark.subject_id].append(mark.score)
    
    averages = {}
    for subject_id, scores in subject_averages.items():
        averages[subject_id] = sum(scores) / len(scores) 
    
    return {
        "term": term,
        "subject_averages": averages,
        "marks": marks
    }

def get_students_by_class(students):
    classes = {}
    for student in students:
        if student.class_name not in classes:
            classes[student.class_name] = 0
        classes[student.class_name] += 1
    return classes