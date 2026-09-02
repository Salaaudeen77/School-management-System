from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import Student, StudentClass, Class, Promotion, User
from schemas import PromotionCreate, PromotionResponse
from auth import get_current_active_user, require_admin

router = APIRouter()

@router.get("/", response_model=List[PromotionResponse])
def get_promotions(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    promotions = db.query(Promotion).order_by(Promotion.promoted_at.desc()).offset(skip).limit(limit).all()
    return promotions

@router.post("/")
def promote_student(
    promotion: PromotionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    # Check if student exists
    student = db.query(Student).filter(Student.id == promotion.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Check if student is already graduated
    if student.is_graduated:
        raise HTTPException(status_code=400, detail="Student is already graduated")
    
    # Check if classes exist
    from_class = db.query(Class).filter(Class.id == promotion.from_class_id).first()
    if not from_class:
        raise HTTPException(status_code=404, detail="From class not found")
    
    to_class = db.query(Class).filter(Class.id == promotion.to_class_id).first()
    if not to_class:
        raise HTTPException(status_code=404, detail="To class not found")
    
    # Check if student is currently in the from_class
    current_assignment = db.query(StudentClass).filter(
        StudentClass.student_id == promotion.student_id,
        StudentClass.is_current == True
    ).first()
    
    if not current_assignment or current_assignment.class_id != promotion.from_class_id:
        raise HTTPException(status_code=400, detail="Student is not currently in the specified class")
    
    # If promoting to Form 3 and beyond, check if they graduate
    is_graduating = promotion.to_class_id == 9  # Form 3 is id 9
    
    # Update student's class assignment
    current_assignment.is_current = False
    
    # Create new class assignment
    new_assignment = StudentClass(
        student_id=promotion.student_id,
        class_id=promotion.to_class_id,
        academic_year=promotion.academic_year,
        is_current=True
    )
    db.add(new_assignment)
    
    # If graduating, mark student as graduated
    if is_graduating:
        student.is_graduated = True
        student.graduation_date = func.now()
    
    # Record promotion
    promotion_record = Promotion(
        student_id=promotion.student_id,
        from_class_id=promotion.from_class_id,
        to_class_id=promotion.to_class_id,
        academic_year=promotion.academic_year,
        promoted_by=current_user.id
    )
    db.add(promotion_record)
    
    db.commit()
    
    return {
        "message": f"Student promoted successfully!",
        "student": student.id,
        "from_class": from_class.name,
        "to_class": to_class.name,
        "is_graduated": is_graduating
    }

@router.post("/promote-all")
def promote_all_students(
    from_class_id: int,
    to_class_id: int,
    academic_year: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    # Get all students in the current class
    students = db.query(Student).join(StudentClass).filter(
        StudentClass.class_id == from_class_id,
        StudentClass.is_current == True,
        Student.is_graduated == False
    ).all()
    
    if not students:
        raise HTTPException(status_code=404, detail="No students found in this class")
    
    promoted_count = 0
    for student in students:
        promotion = PromotionCreate(
            student_id=student.id,
            from_class_id=from_class_id,
            to_class_id=to_class_id,
            academic_year=academic_year
        )
        promote_student(promotion, db, current_user)
        promoted_count += 1
    
    return {
        "message": f"Successfully promoted {promoted_count} students",
        "count": promoted_count
    }

@router.get("/students/{student_id}")
def get_student_promotion_history(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    promotions = db.query(Promotion).filter(Promotion.student_id == student_id).all()
    return {
        "student": student,
        "promotions": promotions
    }