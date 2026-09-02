"""
One-time script to seed the database with classes, subjects, and fee structures.
Run: python backend/seed_data.py
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
from models import Class, Subject, FeeStructure, User
from auth import get_password_hash
from datetime import datetime

def seed_classes(db):
    """Create all 9 classes"""
    classes = [
        {"name": "Primary 1", "level": "Primary", "code": "P1", "academic_year": "2026"},
        {"name": "Primary 2", "level": "Primary", "code": "P2", "academic_year": "2026"},
        {"name": "Primary 3", "level": "Primary", "code": "P3", "academic_year": "2026"},
        {"name": "Primary 4", "level": "Primary", "code": "P4", "academic_year": "2026"},
        {"name": "Primary 5", "level": "Primary", "code": "P5", "academic_year": "2026"},
        {"name": "Primary 6", "level": "Primary", "code": "P6", "academic_year": "2026"},
        {"name": "Form 1", "level": "JHS", "code": "J1", "academic_year": "2026"},
        {"name": "Form 2", "level": "JHS", "code": "J2", "academic_year": "2026"},
        {"name": "Form 3", "level": "JHS", "code": "J3", "academic_year": "2026"},
    ]
    
    created = 0
    for class_data in classes:
        existing = db.query(Class).filter(Class.code == class_data["code"]).first()
        if not existing:
            new_class = Class(**class_data)
            db.add(new_class)
            created += 1
    
    db.commit()
    print(f"✅ Created {created} classes")
    return created

def seed_subjects(db):
    """Create subjects for each class"""
    # Get all classes
    classes = db.query(Class).all()
    
    subject_templates = {
        "Primary": ["English", "Mathematics", "Science", "Social Studies", 
                   "Ghanaian Language", "Religious Studies", "Creative Arts"],
        "Primary Upper": ["English", "Mathematics", "Science", "Social Studies", 
                         "Ghanaian Language", "Religious Studies", "Creative Arts", "ICT"],
        "JHS": ["English", "Mathematics", "Integrated Science", "Social Studies", 
               "Ghanaian Language", "Religious Studies", "Basic Design & Technology", 
               "ICT", "Career Technology"]
    }
    
    created = 0
    for cls in classes:
        # Determine which subjects to add
        if cls.level == "Primary":
            if int(cls.code[1]) <= 3:  # P1, P2, P3
                subjects = subject_templates["Primary"]
            else:  # P4, P5, P6
                subjects = subject_templates["Primary Upper"]
        else:  # JHS
            subjects = subject_templates["JHS"]
        
        for subject_name in subjects:
            code = f"{subject_name[:4].upper()}-{cls.code}"
            existing = db.query(Subject).filter(
                Subject.class_id == cls.id,
                Subject.name == subject_name
            ).first()
            if not existing:
                new_subject = Subject(
                    name=subject_name,
                    code=code,
                    class_id=cls.id
                )
                db.add(new_subject)
                created += 1
    
    db.commit()
    print(f"✅ Created {created} subjects")
    return created

def seed_fee_structures(db):
    """Create fee structures for each class"""
    classes = db.query(Class).all()
    
    fee_amounts = {
        "P1": 300, "P2": 300, "P3": 300,
        "P4": 400, "P5": 400, "P6": 400,
        "J1": 500, "J2": 500, "J3": 500
    }
    
    terms = ["Term 1", "Term 2", "Term 3"]
    created = 0
    
    for cls in classes:
        amount = fee_amounts.get(cls.code, 400)
        for term in terms:
            existing = db.query(FeeStructure).filter(
                FeeStructure.class_id == cls.id,
                FeeStructure.term == term,
                FeeStructure.academic_year == "2026"
            ).first()
            if not existing:
                fee = FeeStructure(
                    class_id=cls.id,
                    term=term,
                    academic_year="2026",
                    amount=amount,
                    description=f"Fees for {cls.name} - {term} 2026"
                )
                db.add(fee)
                created += 1
    
    db.commit()
    print(f"✅ Created {created} fee structures")
    return created

def main():
    print("=" * 50)
    print("🏫 SCHOOL SYSTEM SEEDER")
    print("=" * 50)
    
    db = SessionLocal()
    
    try:
        print("\n📌 Creating classes...")
        seed_classes(db)
        
        print("\n📌 Creating subjects...")
        seed_subjects(db)
        
        print("\n📌 Creating fee structures...")
        seed_fee_structures(db)
        
        print("\n" + "=" * 50)
        print("✅ SEEDING COMPLETE!")
        print("=" * 50)
        print("\n📋 Summary:")
        print("  - 9 Classes created")
        print("  - Subjects for each class created")
        print("  - Fee structures for each class created")
        print("\n🚀 You can now login with your existing admin account!")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    main()