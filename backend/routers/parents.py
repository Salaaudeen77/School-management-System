from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List

from database import get_db
from models import Parent, Student, ParentStudent, StudentClass, Class, User
from schemas import ParentCreate, ParentResponse
from auth import get_current_active_user, require_admin

router = APIRouter()

@router.get("/", response_model=List[ParentResponse])
def get_parents(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    parents = db.query(Parent).offset(skip).limit(limit).all()
    return parents

@router.get("/{parent_id}", response_model=ParentResponse)
def get_parent(
    parent_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    parent = db.query(Parent).filter(Parent.id == parent_id).first()
    if not parent:
        raise HTTPException(status_code=404, detail="Parent not found")
    return parent

@router.post("/", response_model=ParentResponse)
def create_parent(
    parent: ParentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    # Check if user exists
    user = db.query(User).filter(User.id == parent.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db_parent = Parent(**parent.model_dump())
    db.add(db_parent)
    db.commit()
    db.refresh(db_parent)
    return db_parent

@router.put("/{parent_id}", response_model=ParentResponse)
def update_parent(
    parent_id: int,
    parent: ParentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    db_parent = db.query(Parent).filter(Parent.id == parent_id).first()
    if not db_parent:
        raise HTTPException(status_code=404, detail="Parent not found")
    
    for key, value in parent.model_dump().items():
        setattr(db_parent, key, value)
    
    db.commit()
    db.refresh(db_parent)
    return db_parent

@router.delete("/{parent_id}")
def delete_parent(
    parent_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    parent = db.query(Parent).filter(Parent.id == parent_id).first()
    if not parent:
        raise HTTPException(status_code=404, detail="Parent not found")
    
    try:
        user_id = parent.user_id
        
        # Delete parent-student links
        db.query(ParentStudent).filter(ParentStudent.parent_id == parent_id).delete()
        
        # Delete the parent
        db.delete(parent)
        
        # Delete the user account
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            db.delete(user)
        
        db.commit()
        
        return {"message": "Parent and user account deleted successfully"}
    except Exception as e:
        db.rollback()
        print(f"Error deleting parent: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{parent_id}/children")
def get_parent_children(
    parent_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):

    parent = db.query(Parent).filter(Parent.id == parent_id).first()
    if not parent:
        raise HTTPException(status_code=404, detail="Parent not found")
    
    # Get all children with their user and class data
    children = db.query(Student).join(ParentStudent).filter(
        ParentStudent.parent_id == parent_id
    ).options(
        joinedload(Student.user)
    ).all()
    
    # Load current class for each child
    for child in children:
        current_assignment = db.query(StudentClass).filter(
            StudentClass.student_id == child.id,
            StudentClass.is_current == True
        ).first()
        
        if current_assignment:
            child.current_class = db.query(Class).filter(
                Class.id == current_assignment.class_id
            ).first()
        else:
            child.current_class = None
    
    return {"parent": parent, "children": children}