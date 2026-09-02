from decouple import config

# Email Configuration
EMAIL_HOST = config("EMAIL_HOST", default="smtp.gmail.com")
EMAIL_PORT = config("EMAIL_PORT", default=587, cast=int)
EMAIL_USER = config("EMAIL_USER", default="your-email@gmail.com")
EMAIL_PASSWORD = config("EMAIL_PASSWORD", default="your-app-password")
EMAIL_USE_TLS = config("EMAIL_USE_TLS", default=True, cast=bool)

# Google Drive Backup
GOOGLE_DRIVE_FOLDER_ID = config("GOOGLE_DRIVE_FOLDER_ID", default="")
GOOGLE_DRIVE_CREDENTIALS = config("GOOGLE_DRIVE_CREDENTIALS", default="credentials.json")

# School Configuration
SCHOOL_NAME = config("SCHOOL_NAME", default="STU Digital Academy")
SCHOOL_TAGLINE = config("SCHOOL_TAGLINE", default="Excellence in Education")