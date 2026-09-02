import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from decouple import config

def send_email_notification(to_email: str, subject: str, body: str):
    """
    Send email notification using SMTP
    """
    # Get email configuration from environment
    smtp_host = config("EMAIL_HOST", default="smtp.gmail.com")
    smtp_port = config("EMAIL_PORT", default=587, cast=int)
    smtp_user = config("EMAIL_USER", default="your-email@gmail.com")
    smtp_password = config("EMAIL_PASSWORD", default="your-app-password")
    
    # Create message
    msg = MIMEMultipart()
    msg["From"] = smtp_user
    msg["To"] = to_email
    msg["Subject"] = subject
    
    msg.attach(MIMEText(body, "plain"))
    
    try:
        # Send email
        server = smtplib.SMTP(smtp_host, smtp_port)
        server.starttls()
        server.login(smtp_user, smtp_password)
        server.send_message(msg)
        server.quit()
        return True
    except Exception as e:
        print(f"Failed to send email: {str(e)}")
        return False

def send_welcome_email(user_email: str, full_name: str, role: str, temp_password: str = None):
    """Send welcome email to new user"""
    subject = f"Welcome to {config('SCHOOL_NAME', default='STU Digital Academy')}"
    
    if temp_password:
        body = f"""
        Dear {full_name},
        
        Welcome to {config('SCHOOL_NAME', default='STU Digital Academy')}!
        
        Your account has been created as a {role}.
        
        Your temporary password is: {temp_password}
        
        Please log in and change your password immediately.
        
        Best regards,
        School Management Team
        """
    else:
        body = f"""
        Dear {full_name},
        
        Welcome to {config('SCHOOL_NAME', default='STU Digital Academy')}!
        
        Your account has been created as a {role}.
        
        You can log in using your email and password.
        
        Best regards,
        School Management Team
        """
    
    send_email_notification(to_email=user_email, subject=subject, body=body)

def send_fee_reminder(student_name: str, parent_email: str, term: str, amount_due: float):
    """Send fee reminder to parent"""
    subject = f"Fee Reminder - {student_name}"
    body = f"""
    Dear Parent/Guardian,
    
    This is a reminder that fees for {student_name} for {term} are due.
    
    Amount Due: {amount_due}
    
    Please make payment as soon as possible.
    
    Best regards,
    School Management Team
    """
    send_email_notification(to_email=parent_email, subject=subject, body=body)

def send_attendance_report(parent_email: str, student_name: str, attendance_summary: dict):
    """Send attendance report to parent"""
    subject = f"Attendance Report - {student_name}"
    body = f"""
    Dear Parent/Guardian,
    
    Attendance report for {student_name}:
    
    Total Days: {attendance_summary['total']}
    Present: {attendance_summary['present']}
    Absent: {attendance_summary['absent']}
    Late: {attendance_summary['late']}
    Attendance Percentage: {attendance_summary['present_percentage']}%
    
    Best regards,
    School Management Team
    """
    send_email_notification(to_email=parent_email, subject=subject, body=body)

def send_announcement(to_emails: List[str], title: str, content: str):
    """Send announcement to multiple recipients"""
    subject = f"School Announcement: {title}"
    body = f"""
    {content}
    
    Best regards,
    School Management Team
    """
    
    for email in to_emails:
        send_email_notification(to_email=email, subject=subject, body=body)