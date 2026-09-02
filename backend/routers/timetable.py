from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from database import get_db
from models import Timetable, User
from schemas import TimetableCreate, TimetableResponse
from auth import require_admin, require_teacher, get_current_active_user

router = APIRouter()

@router.get("/", response_model=List[TimetableResponse])
def get_timetable(
    class_name: str = None,
    day: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(Timetable)
    
    if class_name:
        query = query.filter(Timetable.class_name == class_name)
    if day:
        query = query.filter(Timetable.day == day)
    
    timetable = query.order_by(Timetable.day,Timetable.period).all()
    return timetable

@router.post("/", response_model=TimetableResponse)
def create_timetable_entry(
    entry: TimetableCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    db_entry = Timetable(**entry.model_dump())
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    return db_entry

@router.get("/{timetable_id}", response_model=TimetableResponse)
def get_timetable_entry(
    timetable_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    entry = db.query(Timetable).filter(Timetable.id == timetable_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Timetable entry not found")
    return entry

@router.put("/{timetable_id}", response_model=TimetableResponse)
def update_timetable_entry(
    timetable_id: int,
    entry: TimetableCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    db_entry = db.query(Timetable).filter(Timetable.id == timetable_id).first()
    if not db_entry:
        raise HTTPException(status_code=404, detail="Timetable entry not found")
    
    for key, value in entry.model_dump().items():
        setattr(db_entry, key, value)
    
    db.commit()
    db.refresh(db_entry)
    return db_entry

@router.delete("/{timetable_id}")
def delete_timetable_entry(
    timetable_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    entry = db.query(Timetable).filter(Timetable.id == timetable_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Timetable entry not found")
    
    db.delete(entry)
    db.commit()
    return {"message": "Timetable entry deleted successfully"}

@router.get("/class/{class_name}")
def get_class_timetable(
    class_name: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    entries = db.query(Timetable).filter(Timetable.class_name == class_name).order_by(Timetable.day, Timetable.period).all()
    
    if not entries:
        raise HTTPException(status_code=404, detail="No timetable found for this class")
    
    # Group by day
    days = {}
    for entry in entries:
        if entry.day not in days:
            days[entry.day] = []
        days[entry.day].append({
            "period": entry.period,
            "subject": entry.subject,
            "teacher_id": entry.teacher_id,
            "room": entry.room,
            "start_time": entry.start_time,
            "end_time": entry.end_time
        })
    
    return {"class_name": class_name, "timetable": days}