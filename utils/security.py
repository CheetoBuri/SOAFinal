"""
Security utilities: password hashing, OTP generation, email sending
"""
import hashlib
import secrets
import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

# SMTP Configuration
SMTP_HOST = os.getenv("SMTP_SERVER", "")  # Changed from SMTP_HOST
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SENDER_EMAIL", "")  # Changed from SMTP_USER
SMTP_PASSWORD = os.getenv("SENDER_PASSWORD", "")  # Changed from SMTP_PASSWORD
SMTP_FROM_EMAIL = os.getenv("SENDER_EMAIL", SMTP_USER or "")  # Use SENDER_EMAIL


def hash_password(password: str) -> str:
    """Hash password using SHA256"""
    return hashlib.sha256(password.encode()).hexdigest()


def verify_password(password: str, password_hash: str) -> bool:
    """Verify password against hash"""
    return hash_password(password) == password_hash


def generate_otp() -> str:
    """Generate 6-digit OTP"""
    return ''.join([str(secrets.randbelow(10)) for _ in range(6)])


def send_email(to_email: str, subject: str, html_body: str) -> bool:
    """
    Send email via generic SMTP server.
    
    This uses simple username/password SMTP (e.g. Gmail SMTP with App Password,
    Mailtrap, Outlook, or any other provider) and does NOT require
    domain authentication like SendGrid.
    
    Required .env variables:
      - SMTP_HOST
      - SMTP_PORT (default 587)
      - SMTP_USER
      - SMTP_PASSWORD
      - SMTP_FROM_EMAIL (optional, falls back to SMTP_USER)
    """
    # If SMTP is not configured, just log to console so you can still test OTP.
    if not SMTP_HOST or not SMTP_USER or not SMTP_PASSWORD:
        print("⚠️  SMTP not configured. Would send email:")
        print(f"   To: {to_email}")
        print(f"   Subject: {subject}")
        # For testing, also print a short version of the body (OTP will be inside)
        preview = html_body.replace("\n", " ")
        if len(preview) > 200:
            preview = preview[:200] + "..."
        print(f"   Body preview: {preview}")
        return True

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = SMTP_FROM_EMAIL
        msg["To"] = to_email

        # Only HTML part
        part_html = MIMEText(html_body, "html")
        msg.attach(part_html)

        # Use SSL for Gmail (port 465) or TLS for others (port 587)
        if SMTP_PORT == 465:
            # Gmail with SSL
            with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=30) as server:
                server.login(SMTP_USER, SMTP_PASSWORD)
                server.sendmail(SMTP_FROM_EMAIL, [to_email], msg.as_string())
        else:
            # Other SMTP with STARTTLS
            with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=30) as server:
                server.starttls()
                server.login(SMTP_USER, SMTP_PASSWORD)
                server.sendmail(SMTP_FROM_EMAIL, [to_email], msg.as_string())

        print(f"✅ Email sent to {to_email}")
        return True
    except Exception as e:
        print(f"❌ Email error (SMTP): {e}")
        import traceback
        traceback.print_exc()
        return False
