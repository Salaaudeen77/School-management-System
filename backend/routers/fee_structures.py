from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from database import get_db
from models import FeeStructure, Class, User
from schemas import FeeStructureCreate, FeeStructureResponse
from auth import get_current_active_user, require_admin

router = APIRouter()

@router.get("/", response_model=List[FeeStructureResponse])
def get_fee_structures(
    class_id: Optional[int] = None,
    term: Optional[str] = None,
    academic_year: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(FeeStructure)
    
    if class_id:
        query = query.filter(FeeStructure.class_id == class_id)
    if term:
        query = query.filter(FeeStructure.term == term)
    if academic_year:
        query = query.filter(FeeStructure.academic_year == academic_year)
    
    fees = query.all()
    return fees

@router.get("/{fee_id}", response_model=FeeStructureResponse)
def get_fee_structure(
    fee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    fee = db.query(FeeStructure).filter(FeeStructure.id == fee_id).first()
    if not fee:
        raise HTTPException(status_code=404, detail="Fee structure not found")
    return fee

@router.post("/", response_model=FeeStructureResponse)
def create_fee_structure(
    fee: FeeStructureCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    # Check if class exists
    cls = db.query(Class).filter(Class.id == fee.class_id).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")
    
    # Check if fee structure already exists for this class, term, and year
    existing = db.query(FeeStructure).filter(
        FeeStructure.class_id == fee.class_id,
        FeeStructure.term == fee.term,
        FeeStructure.academic_year == fee.academic_year
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Fee structure already exists for this class, term, and year")
    
    db_fee = FeeStructure(**fee.model_dump())
    db.add(db_fee)
    db.commit()
    db.refresh(db_fee)
    return db_fee

@router.put("/{fee_id}", response_model=FeeStructureResponse)
def update_fee_structure(
    fee_id: int,
    fee: FeeStructureCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    db_fee = db.query(FeeStructure).filter(FeeStructure.id == fee_id).first()
    if not db_fee:
        raise HTTPException(status_code=404, detail="Fee structure not found")
    
    for key, value in fee.model_dump().items():
        setattr(db_fee, key, value)
    
    db.commit()
    db.refresh(db_fee)
    return db_fee

@router.delete("/{fee_id}")
def delete_fee_structure(
    fee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    fee = db.query(FeeStructure).filter(FeeStructure.id == fee_id).first()
    if not fee:
        raise HTTPException(status_code=404, detail="Fee structure not found")
    
    db.delete(fee)
    db.commit()
    return {"message": "Fee structure deleted successfully"}

@router.get("/class/{class_id}")
def get_fees_for_class(
    class_id: int,
    academic_year: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    cls = db.query(Class).filter(Class.id == class_id).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")
    
    query = db.query(FeeStructure).filter(FeeStructure.class_id == class_id)
    
    if academic_year:
        query = query.filter(FeeStructure.academic_year == academic_year)
    
    fees = query.all()
    return {
        "class": cls,
        "fees": fees
    }