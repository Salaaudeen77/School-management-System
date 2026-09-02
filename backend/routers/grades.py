from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List, Optional

from database import get_db
from models import Mark, Student, Subject, User
from schemas import MarkCreate, MarkResponse
from auth import require_teacher, get_current_active_user

router = APIRouter()

@router.get("/", response_model=List[MarkResponse])
def get_marks(
    skip: int = 0,
    limit: int = 100,
    student_id: int = None,
    subject_id: int = None,
    term: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(Mark)
    
    if student_id:
        query = query.filter(Mark.student_id == student_id)
    if subject_id:
        query = query.filter(Mark.subject_id == subject_id)
    if term:
        query = query.filter(Mark.term == term)
    
    marks = query.options(joinedload(Mark.student)).offset(skip).limit(limit).all()
    return marks

@router.get("/count")
def get_marks_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    count = db.query(Mark).count()
    return {"count": count}

@router.post("/", response_model=MarkResponse)
def create_mark(
    mark: MarkCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    # Check if student exists
    student = db.query(Student).filter(Student.id == mark.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Check if subject exists
    subject = db.query(Subject).filter(Subject.id == mark.subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    # Check if mark already exists for this student, subject, and term
    existing = db.query(Mark).filter(
        Mark.student_id == mark.student_id,
        Mark.subject_id == mark.subject_id,
        Mark.term == mark.term
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Mark already exists for this student, subject, and term")
    
    db_mark = Mark(**mark.model_dump())
    db.add(db_mark)
    db.commit()
    db.refresh(db_mark)
    return db_mark

@router.put("/{mark_id}", response_model=MarkResponse)
def update_mark(
    mark_id: int,
    mark: MarkCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    db_mark = db.query(Mark).filter(Mark.id == mark_id).first()
    if not db_mark:
        raise HTTPException(status_code=404, detail="Mark not found")
    
    for key, value in mark.model_dump().items():
        setattr(db_mark, key, value)
    
    db.commit()
    db.refresh(db_mark)
    return db_mark

# ✅ DELETE mark
@router.delete("/{mark_id}")
def delete_mark(
    mark_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    mark = db.query(Mark).filter(Mark.id == mark_id).first()
    if not mark:
        raise HTTPException(status_code=404, detail="Mark not found")
    
    db.delete(mark)
    db.commit()
    return {"message": "Mark deleted successfully"}

@router.get("/report-card/{student_id}")
def get_report_card(
    student_id: int,
    term: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    marks = db.query(Mark).filter(
        Mark.student_id == student_id,
        Mark.term == term
    ).all()
    
    total_score = sum(m.score for m in marks)
    average = total_score / len(marks) if marks else 0
    
    return {
        "student": student,
        "term": term,
        "marks": marks,
        "total_score": total_score,
        "average": average,
        "grade": get_letter_grade(average)
    }

def get_letter_grade(score: float) -> str:
    if score >= 80:
        return "A"
    elif score >= 70:
        return "B"
    elif score >= 60:
        return "C"
    elif score >= 50:
        return "D"
    else:
        return "F"
