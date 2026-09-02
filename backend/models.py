from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean, Text, Date, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import enum


# Enums
class UserRole(str, enum.Enum):
    ADMIN = "admin"
    TEACHER = "teacher"
    STUDENT = "student"
    PARENT = "parent"


class Term(str, enum.Enum):
    TERM_1 = "Term 1"
    TERM_2 = "Term 2"
    TERM_3 = "Term 3"


# ============================================
# USER MODEL
# ============================================
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False)
    full_name = Column(String(100), nullable=False)
    phone = Column(String(20))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())

    # Relationships
    teacher_profile = relationship("Teacher", back_populates="user", uselist=False)
    student_profile = relationship("Student", back_populates="user", uselist=False)
    parent_profile = relationship("Parent", back_populates="user", uselist=False)


# ============================================
# CLASS MODEL
# ============================================
class Class(Base):
    __tablename__ = "classes"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False)  # "Primary 1", "Form 1", etc.
    level = Column(String(20), nullable=False)  # "Primary", "JHS"
    code = Column(String(10), unique=True, nullable=False)  # "P1", "P2", "J1", etc.
    academic_year = Column(String(10), nullable=False)  # "2024", "2025"
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    students = relationship("StudentClass", back_populates="class_obj")
    subjects = relationship("Subject", back_populates="class_obj")
    fee_structures = relationship("FeeStructure", back_populates="class_obj")


# ============================================
# STUDENT MODEL
# ============================================
class Student(Base):
    __tablename__ = "students"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    admission_number = Column(String(50), unique=True, index=True)
    date_of_birth = Column(Date)
    gender = Column(String(10))
    address = Column(Text)
    grade = Column(String(10))
    guardian_name = Column(String(100))
    guardian_phone = Column(String(20))
    guardian_email = Column(String(100))
    photo = Column(String(255))
    is_graduated = Column(Boolean, default=False)
    graduation_date = Column(DateTime)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="student_profile")
    class_assignments = relationship("StudentClass", back_populates="student")
    marks = relationship("Mark", back_populates="student")
    attendance = relationship("Attendance", back_populates="student")
    payments = relationship("Payment", back_populates="student")

# ============================================
# STUDENT-CLASS ASSIGNMENT (Enrollment)
# ============================================
class StudentClass(Base):
    __tablename__ = "student_classes"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=False)
    academic_year = Column(String(10), nullable=False)
    is_current = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    
    student = relationship("Student", back_populates="class_assignments")
    class_obj = relationship("Class", back_populates="students")


# ============================================
# TEACHER MODEL
# ============================================
class Teacher(Base):
    __tablename__ = "teachers"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    employee_id = Column(String(50), unique=True, index=True)
    subject = Column(String(100))
    qualification = Column(String(100))
    experience = Column(Integer)
    hire_date = Column(Date)
    department = Column(String(50))
    photo = Column(String(255))
    created_at = Column(DateTime, server_default=func.now())
    
    user = relationship("User", back_populates="teacher_profile")
    subjects = relationship("TeacherSubject", back_populates="teacher")


# ============================================
# TEACHER-SUBJECT ASSIGNMENT
# ============================================
class TeacherSubject(Base):
    __tablename__ = "teacher_subjects"
    
    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("teachers.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=False)
    academic_year = Column(String(10), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    
    teacher = relationship("Teacher", back_populates="subjects")
    subject = relationship("Subject", back_populates="teachers")
    class_obj = relationship("Class")


# ============================================
# SUBJECT MODEL
# ============================================
class Subject(Base):
    __tablename__ = "subjects"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False)
    code = Column(String(20), nullable=False)
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    
    class_obj = relationship("Class", back_populates="subjects")
    teachers = relationship("TeacherSubject", back_populates="subject")
    marks = relationship("Mark", back_populates="subject")


# ============================================
# PROMOTION MODEL
# ============================================
class Promotion(Base):
    __tablename__ = "promotions"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    from_class_id = Column(Integer, ForeignKey("classes.id"), nullable=False)
    to_class_id = Column(Integer, ForeignKey("classes.id"), nullable=False)
    academic_year = Column(String(10), nullable=False)
    promoted_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    promoted_at = Column(DateTime, server_default=func.now())
    
    # Relationships with explicit foreign_keys
    student = relationship("Student", foreign_keys=[student_id])
    from_class = relationship("Class", foreign_keys=[from_class_id])
    to_class = relationship("Class", foreign_keys=[to_class_id])
    promoter = relationship("User", foreign_keys=[promoted_by])


# ============================================
# PARENT MODEL
# ============================================
class Parent(Base):
    __tablename__ = "parents"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    occupation = Column(String(100))
    address = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    
    user = relationship("User", back_populates="parent_profile")
    children = relationship("ParentStudent", back_populates="parent")


class ParentStudent(Base):
    __tablename__ = "parent_students"
    
    id = Column(Integer, primary_key=True, index=True)
    parent_id = Column(Integer, ForeignKey("parents.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    relationship_type = Column(String(20))  # mother, father, guardian
    
    parent = relationship("Parent", back_populates="children")
    student = relationship("Student")


# ============================================
# MARK/GRADE MODEL
# ============================================
class Mark(Base):
    __tablename__ = "marks"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    term = Column(String(20), nullable=False)  # Term 1, Term 2, Term 3
    academic_year = Column(String(10), nullable=False)
    score = Column(Float, nullable=False)
    grade = Column(String(2), nullable=False)  # A, B, C, D, F
    remarks = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
    
    student = relationship("Student", back_populates="marks")
    subject = relationship("Subject", back_populates="marks")


# ============================================
# ATTENDANCE MODEL
# ============================================
class Attendance(Base):
    __tablename__ = "attendance"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    date = Column(Date, nullable=False)
    status = Column(String(20), nullable=False)  # present, absent, late, excused
    teacher_id = Column(Integer, nullable=True)
    remarks = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    
    student = relationship("Student", back_populates="attendance")


# ============================================
# FEE STRUCTURE MODEL
# ============================================
class FeeStructure(Base):
    __tablename__ = "fee_structures"
    
    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=False)
    term = Column(String(20), nullable=False)
    academic_year = Column(String(10), nullable=False)
    amount = Column(Float, nullable=False)
    description = Column(String(255))
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
    
    class_obj = relationship("Class", back_populates="fee_structures")


# ============================================
# PAYMENT MODEL
# ============================================
class Payment(Base):
    __tablename__ = "payments"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    term = Column(String(20), nullable=False)
    academic_year = Column(String(10), nullable=False)
    amount = Column(Float, nullable=False)
    amount_paid = Column(Float, default=0)
    status = Column(String(20), default="pending")  # paid, pending, overdue
    payment_date = Column(Date)
    payment_method = Column(String(20))  # cash, bank transfer, mobile money
    receipt_number = Column(String(50))
    notes = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
    
    student = relationship("Student", back_populates="payments")


# ============================================
# TIMETABLE MODEL
# ============================================
class Timetable(Base):
    __tablename__ = "timetables"
    
    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=False)
    day = Column(String(10), nullable=False)  # Monday, Tuesday, etc.
    period = Column(Integer, nullable=False)  # 1, 2, 3, 4, 5, 6, 7, 8
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    teacher_id = Column(Integer, ForeignKey("teachers.id"), nullable=False)
    room = Column(String(20))
    start_time = Column(String(10), nullable=False)
    end_time = Column(String(10), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
    
    class_obj = relationship("Class")
    subject = relationship("Subject")
    teacher = relationship("Teacher")


# ============================================
# ANNOUNCEMENT MODEL
# ============================================
class Announcement(Base):
    __tablename__ = "announcements"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    audience = Column(String(50), default="all")  # all, teachers, students, parents
    is_published = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
    
    author = relationship("User")