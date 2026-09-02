import os
import subprocess
from datetime import datetime
from decouple import config

def create_database_backup():
    """Create a MySQL database backup"""
    db_url = config("DATABASE_URL", default="mysql+pymysql://root:root123@localhost:3306/school_db")
    
    # Parse database URL
    # Format: mysql+pymysql://username:password@host:port/database_name
    parts = db_url.replace("mysql+pymysql://", "").split("@")
    auth = parts[0].split(":")
    username = auth[0]
    password = auth[1]
    host_db = parts[1].split("/")
    host = host_db[0].split(":")[0]
    database = host_db[1]
    
    # Create backup filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_filename = f"backup_{database}_{timestamp}.sql"
    backup_path = f"backups/{backup_filename}"
    
    # Create backups directory
    os.makedirs("backups", exist_ok=True)
    
    # Run mysqldump
    try:
        subprocess.run([
            "mysqldump",
            f"--host={host}",
            f"--user={username}",
            f"--password={password}",
            "--add-drop-table",
            "--single-transaction",
            "--skip-lock-tables",
            database,
            f"--result-file={backup_path}"
        ], check=True)
        
        print(f"Backup created: {backup_path}")
        return backup_path
    except Exception as e:
        print(f"Backup failed: {str(e)}")
        return None

def rotate_backups(max_backups=30):
    """Keep only the last N backups"""
    backup_dir = "backups"
    if not os.path.exists(backup_dir):
        return
    
    # Get all backup files
    backups = []
    for filename in os.listdir(backup_dir):
        if filename.endswith(".sql"):
            path = os.path.join(backup_dir, filename)
            backups.append((path, os.path.getctime(path)))
    
    # Sort by creation time (newest first)
    backups.sort(key=lambda x: x[1], reverse=True)
    
    # Remove old backups
    if len(backups) > max_backups:
        for path, _ in backups[max_backups:]:
            os.remove(path)
            print(f"Removed old backup: {path}")

# For Google Drive integration (optional)
def upload_to_google_drive(file_path: str):
    """
    Upload backup to Google Drive
    Requires: google-auth, google-auth-oauthlib, google-auth-httplib2, google-api-python-client
    """
    try:
        from google.oauth2.credentials import Credentials
        from googleapiclient.discovery import build
        from googleapiclient.http import MediaFileUpload
        
        # Load credentials
        creds = Credentials.from_authorized_user_file(
            config("GOOGLE_DRIVE_CREDENTIALS", default="credentials.json")
        )
        
        drive_service = build("drive", "v3", credentials=creds)
        
        file_metadata = {
            "name": os.path.basename(file_path),
            "parents": [config("GOOGLE_DRIVE_FOLDER_ID")]
        }
        
        media = MediaFileUpload(file_path, mimetype="application/sql")
        
        file = drive_service.files().create(
            body=file_metadata,
            media_body=media,
            fields="id"
        ).execute()
        
        print(f"Backup uploaded to Google Drive: {file.get('id')}")
        return True
    except Exception as e:
        print(f"Failed to upload to Google Drive: {str(e)}")
        return False

def run_backup():
    """Run full backup process"""
    backup_path = create_database_backup()
    if backup_path:
        # Rotate backups locally
        rotate_backups()
        
        # Optionally upload to Google Drive
        if config("GOOGLE_DRIVE_FOLDER_ID", default=""):
            upload_to_google_drive(backup_path)