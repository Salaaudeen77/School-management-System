from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import Class, User
from schemas import ClassCreate, ClassResponse
from auth import get_current_active_user, require_admin

router = APIRouter()

@router.get("/", response_model=List[ClassResponse])
def get_classes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    classes = db.query(Class).filter(Class.is_active == True).order_by(Class.id).all()
    return classes

@router.get("/{class_id}", response_model=ClassResponse)
def get_class(
    class_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    cls = db.query(Class).filter(Class.id == class_id).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")
    return cls

@router.post("/", response_model=ClassResponse)
def create_class(
    class_data: ClassCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    # Check if class code already exists
    existing = db.query(Class).filter(Class.code == class_data.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Class code already exists")
    
    db_class = Class(**class_data.model_dump())
    db.add(db_class)
    db.commit()
    db.refresh(db_class)
    return db_class

@router.put("/{class_id}", response_model=ClassResponse)
def update_class(
    class_id: int,
    class_data: ClassCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    db_class = db.query(Class).filter(Class.id == class_id).first()
    if not db_class:
        raise HTTPException(status_code=404, detail="Class not found")
    
    for key, value in class_data.model_dump().items():
        setattr(db_class, key, value)
    
    db.commit()
    db.refresh(db_class)
    return db_class

@router.delete("/{class_id}")
def delete_class(
    class_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    db_class = db.query(Class).filter(Class.id == class_id).first()
    if not db_class:
        raise HTTPException(status_code=404, detail="Class not found")
    
    db_class.is_active = False
    db.commit()
    return {"message": "Class deactivated successfully"}