from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List, Optional
from fastapi.responses import JSONResponse

from database import get_db
from models import Payment, Student
from schemas import PaymentCreate, PaymentResponse
from auth import get_current_active_user, require_admin

router = APIRouter()

@router.get("/", response_model=List[PaymentResponse])
def get_payments(
    skip: int = 0,
    limit: int = 100,
    student_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    query = db.query(Payment)
    
    if student_id:
        query = query.filter(Payment.student_id == student_id)
    
    # Load the student relationship to get the student name
    payments = query.options(joinedload(Payment.student)).offset(skip).limit(limit).all()
    return payments

@router.get("/total")
def get_total_payments(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Get total amount of all payments collected"""
    try:
        total = db.query(func.sum(Payment.amount_paid)).filter(
            Payment.status == "paid"
        ).scalar()
        
        # Use JSONResponse to bypass any schema validation
        return JSONResponse(content={"total": float(total) if total else 0.0})
    except Exception as e:
        print(f"Error in /total: {e}")
        return JSONResponse(content={"total": 0.0})
    
@router.get("/count")
def get_payments_count(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    count = db.query(Payment).count()
    return {"count": count}

@router.post("/", response_model=PaymentResponse)
def create_payment(
    payment: PaymentCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    # Check if student exists
    student = db.query(Student).filter(Student.id == payment.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    db_payment = Payment(**payment.model_dump())
    db.add(db_payment)
    db.commit()
    db.refresh(db_payment)
    return db_payment

@router.get("/{payment_id}", response_model=PaymentResponse)
def get_payment(
    payment_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return payment

@router.put("/{payment_id}", response_model=PaymentResponse)
def update_payment(
    payment_id: int,
    payment: PaymentCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    db_payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not db_payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    for key, value in payment.model_dump().items():
        setattr(db_payment, key, value)
    
    db.commit()
    db.refresh(db_payment)
    return db_payment

@router.delete("/{payment_id}")
def delete_payment(
    payment_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    db.delete(payment)
    db.commit()
    return {"message": "Payment deleted successfully"}

