from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import ParentStudent, Student, Parent, User
from auth import get_current_active_user, require_admin

router = APIRouter()

@router.get("/students/{student_id}/parents")
def get_student_parents(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all parents linked to a student"""
    parents = db.query(Parent).join(ParentStudent).filter(
        ParentStudent.student_id == student_id
    ).all()
    
    # Add relationship type to each parent
    result = []
    for parent in parents:
        ps = db.query(ParentStudent).filter(
            ParentStudent.parent_id == parent.id,
            ParentStudent.student_id == student_id
        ).first()
        result.append({
            "id": parent.id,
            "user_id": parent.user_id,
            "user": parent.user,
            "occupation": parent.occupation,
            "address": parent.address,
            "relationship_type": ps.relationship_type if ps else None
        })
    
    return result

@router.post("/students/{student_id}/link-parent")
def link_parent_to_student(
    student_id: int,
    parent_id: int,
    relationship: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Link a parent to a student"""
    # Check if student exists
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Check if parent exists
    parent = db.query(Parent).filter(Parent.id == parent_id).first()
    if not parent:
        raise HTTPException(status_code=404, detail="Parent not found")
    
    # Check if already linked
    existing = db.query(ParentStudent).filter(
        ParentStudent.parent_id == parent_id,
        ParentStudent.student_id == student_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Parent already linked to this student")
    
    # Create link
    link = ParentStudent(
        parent_id=parent_id,
        student_id=student_id,
        relationship_type=relationship
    )
    db.add(link)
    db.commit()
    db.refresh(link)
    
    return {"message": "Parent linked successfully", "link": link}

@router.delete("/students/{student_id}/unlink-parent/{parent_id}")
def unlink_parent_from_student(
    student_id: int,
    parent_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Unlink a parent from a student"""
    link = db.query(ParentStudent).filter(
        ParentStudent.parent_id == parent_id,
        ParentStudent.student_id == student_id
    ).first()
    
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")
    
    db.delete(link)
    db.commit()
    
    return {"message": "Parent unlinked successfully"}