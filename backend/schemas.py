from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import date, datetime


# ============================================
# TOKEN SCHEMA (for login) - ✅ ADD THIS
# ============================================
class Token(BaseModel):
    access_token: str
    token_type: str
    user: Optional[dict] = None


# ============================================
# USER SCHEMAS
# ============================================
class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: str
    phone: Optional[str] = None

class UserCreate(UserBase):
    password: str
    role: str = "student"

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(UserBase):
    id: int
    role: str
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============================================
# CLASS SCHEMAS
# ============================================
class ClassBase(BaseModel):
    name: str
    level: str
    code: str
    academic_year: str

class ClassCreate(ClassBase):
    pass

class ClassResponse(ClassBase):
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============================================
# STUDENT-CLASS SCHEMAS
# ============================================
class StudentClassBase(BaseModel):
    student_id: int
    class_id: int
    academic_year: str

class StudentClassCreate(StudentClassBase):
    pass

class StudentClassResponse(StudentClassBase):
    id: int
    is_current: bool
    created_at: datetime
    class_obj: Optional[ClassResponse] = None
    
    class Config:
        from_attributes = True


# ============================================
# STUDENT SCHEMAS
# ============================================
class StudentBase(BaseModel):
    admission_number: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    guardian_name: Optional[str] = None
    guardian_phone: Optional[str] = None
    guardian_email: Optional[EmailStr] = None

class StudentCreate(StudentBase):
    user_id: int
    class_id: int
    academic_year: str
    grade: Optional[str] = None

class StudentResponse(StudentBase):
    id: int
    user_id: int
    photo: Optional[str] = None
    is_graduated: bool
    created_at: datetime
    user: Optional[UserResponse] = None
    current_class: Optional[ClassResponse] = None
    grade: Optional[str] = None

    class Config:
        from_attributes = True


# ============================================
# TEACHER SCHEMAS
# ============================================
class TeacherBase(BaseModel):
    employee_id: Optional[str] = None
    subject: Optional[str] = None 
    qualification: Optional[str] = None
    experience: Optional[int] = 0
    hire_date: Optional[date] = None
    department: Optional[str] = None

class TeacherCreate(TeacherBase):
    user_id: int

class TeacherResponse(TeacherBase):
    id: int
    user_id: int
    photo: Optional[str] = None
    user: Optional[UserResponse] = None
    
    class Config:
        from_attributes = True


# ============================================
# SUBJECT SCHEMAS
# ============================================
class SubjectBase(BaseModel):
    name: str
    code: str
    class_id: int

class SubjectCreate(SubjectBase):
    pass

class SubjectResponse(SubjectBase):
    id: int
    created_at: datetime
    class_obj: Optional[ClassResponse] = None
    
    class Config:
        from_attributes = True


# ============================================
# TEACHER-SUBJECT SCHEMAS
# ============================================
class TeacherSubjectBase(BaseModel):
    teacher_id: int
    subject_id: int
    class_id: int
    academic_year: str

class TeacherSubjectCreate(TeacherSubjectBase):
    pass

class TeacherSubjectResponse(TeacherSubjectBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============================================
# PROMOTION SCHEMAS
# ============================================
class PromotionBase(BaseModel):
    student_id: int
    from_class_id: int
    to_class_id: int
    academic_year: str

class PromotionCreate(PromotionBase):
    pass

class PromotionResponse(PromotionBase):
    id: int
    promoted_by: int
    promoted_at: datetime
    student: Optional[StudentResponse] = None
    from_class: Optional[ClassResponse] = None
    to_class: Optional[ClassResponse] = None
    
    class Config:
        from_attributes = True


# ============================================
# PARENT SCHEMAS
# ============================================
class ParentBase(BaseModel):
    occupation: Optional[str] = None
    address: Optional[str] = None

class ParentCreate(ParentBase):
    user_id: int

class ParentResponse(ParentBase):
    id: int
    user_id: int
    user: Optional[UserResponse] = None
    
    class Config:
        from_attributes = True


# ============================================
# MARK/GRADE SCHEMAS
# ============================================
class MarkBase(BaseModel):
    student_id: int
    subject_id: int
    term: str
    academic_year: str
    score: float
    grade: str
    remarks: Optional[str] = None

class MarkCreate(MarkBase):
    pass

class MarkResponse(MarkBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    student: Optional[StudentResponse] = None
    subject: Optional[SubjectResponse] = None
    
    class Config:
        from_attributes = True


# ============================================
# ATTENDANCE SCHEMAS
# ============================================
class AttendanceBase(BaseModel):
    student_id: int
    date: date
    status: str
    teacher_id: Optional[int] = None
    remarks: Optional[str] = None

class AttendanceCreate(AttendanceBase):
    pass

class AttendanceResponse(AttendanceBase):
    id: int
    created_at: datetime
    student: Optional[StudentResponse] = None
    teacher_id: Optional[int] = None
    
    class Config:
        from_attributes = True


# ============================================
# FEE STRUCTURE SCHEMAS
# ============================================
class FeeStructureBase(BaseModel):
    class_id: int
    term: str
    academic_year: str
    amount: float
    description: Optional[str] = None

class FeeStructureCreate(FeeStructureBase):
    pass

class FeeStructureResponse(FeeStructureBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    class_obj: Optional[ClassResponse] = None
    
    class Config:
        from_attributes = True


# ============================================
# PAYMENT SCHEMAS
# ============================================
class PaymentBase(BaseModel):
    student_id: int
    term: str
    academic_year: str
    amount: float
    amount_paid: Optional[float] = 0
    status: str = "pending"
    payment_date: Optional[date] = None
    payment_method: Optional[str] = None
    receipt_number: Optional[str] = None
    notes: Optional[str] = None

class PaymentCreate(PaymentBase):
    pass

class PaymentResponse(PaymentBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    student: Optional[StudentResponse] = None
    
    class Config:
        from_attributes = True


# ============================================
# TIMETABLE SCHEMAS
# ============================================
class TimetableBase(BaseModel):
    class_id: int
    day: str
    period: int
    subject_id: int
    teacher_id: int
    room: Optional[str] = None
    start_time: str
    end_time: str

class TimetableCreate(TimetableBase):
    pass

class TimetableResponse(TimetableBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


# ============================================
# ANNOUNCEMENT SCHEMAS
# ============================================
class AnnouncementBase(BaseModel):
    title: str
    content: str
    audience: str = "all"
    is_published: bool = True

class AnnouncementCreate(AnnouncementBase):
    pass

class AnnouncementResponse(AnnouncementBase):
    id: int
    author_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    author: Optional[UserResponse] = None
    
    class Config:
        from_attributes = True