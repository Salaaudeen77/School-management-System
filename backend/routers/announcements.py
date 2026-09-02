from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List

from database import get_db
from models import Announcement, User
from schemas import AnnouncementCreate, AnnouncementResponse
from auth import require_admin, get_current_active_user

router = APIRouter()

@router.get("/", response_model=List[AnnouncementResponse])
def get_announcements(
    skip: int = 0,
    limit: int = 100,
    audience: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(Announcement).filter(Announcement.is_published == True)
    
    if audience:
        query = query.filter(Announcement.audience.in_(["all", audience]))
    
    announcements = query.options(joinedload(Announcement.author)).order_by(
        Announcement.created_at.desc()).offset(skip).limit(limit).all()
    return announcements

@router.post("/", response_model=AnnouncementResponse)
def create_announcement(
    announcement: AnnouncementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    db_announcement = Announcement(
        **announcement.model_dump(),
        author_id=current_user.id
    )
    db.add(db_announcement)
    db.commit()
    db.refresh(db_announcement)
    return db_announcement

@router.get("/{announcement_id}", response_model=AnnouncementResponse)
def get_announcement(
    announcement_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    announcement = db.query(Announcement).filter(Announcement.id == announcement_id).first()
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")
    return announcement

@router.put("/{announcement_id}", response_model=AnnouncementResponse)
def update_announcement(
    announcement_id: int,
    announcement: AnnouncementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    db_announcement = db.query(Announcement).filter(Announcement.id == announcement_id).first()
    if not db_announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")
    
    for key, value in announcement.model_dump().items():
        setattr(db_announcement, key, value)
    
    db.commit()
    db.refresh(db_announcement)
    return db_announcement

@router.delete("/{announcement_id}")
def delete_announcement(
    announcement_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    announcement = db.query(Announcement).filter(Announcement.id == announcement_id).first()
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")
    
    db.delete(announcement)
    db.commit()
    return {"message": "Announcement deleted successfully"}

@router.post("/{announcement_id}/publish")
def toggle_publish(
    announcement_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    announcement = db.query(Announcement).filter(Announcement.id == announcement_id).first()
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")
    
    announcement.is_published = not announcement.is_published
    db.commit()
    
    return {"message": f"Announcement {'published' if announcement.is_published else 'unpublished'}"}