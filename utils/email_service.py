"""
Email Service - Send notification emails to users
"""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

# Email configuration
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SENDER_EMAIL = os.getenv("SENDER_EMAIL", "")
SENDER_PASSWORD = os.getenv("SENDER_PASSWORD", "")
SENDER_NAME = os.getenv("SENDER_NAME", "Cafe Ordering System")


def format_currency(amount):
    """Format currency in Vietnamese dong"""
    return f"₫{amount:,.0f}"


def send_refund_email(recipient_email: str, recipient_name: str, order_id: str, refund_amount: float, order_items: str = ""):
    """
    Send refund confirmation email when order is cancelled.
    
    Args:
        recipient_email: User's email address
        recipient_name: User's name
        order_id: Cancelled order ID
        refund_amount: Amount refunded to balance
        order_items: Optional order items summary
    """
    if not SENDER_EMAIL or not SENDER_PASSWORD:
        print("⚠️ Email credentials not configured. Skipping email.")
        return False
    
    try:
        # Create email message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = f"🔄 Order Cancelled - Refund Confirmation #{order_id}"
        msg['From'] = f"{SENDER_NAME} <{SENDER_EMAIL}>"
        msg['To'] = recipient_email
        
        # Email content (HTML)
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {{
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }}
                .container {{
                    background: #ffffff;
                    border-radius: 10px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    overflow: hidden;
                }}
                .header {{
                    background: linear-gradient(135deg, #c41e3a 0%, #8b1429 100%);
                    color: white;
                    padding: 30px;
                    text-align: center;
                }}
                .header h1 {{
                    margin: 0;
                    font-size: 24px;
                }}
                .header .icon {{
                    font-size: 48px;
                    margin-bottom: 10px;
                }}
                .content {{
                    padding: 30px;
                }}
                .greeting {{
                    font-size: 18px;
                    color: #c41e3a;
                    margin-bottom: 20px;
                }}
                .info-box {{
                    background: #f8f9fa;
                    border-left: 4px solid #c41e3a;
                    padding: 20px;
                    margin: 20px 0;
                    border-radius: 4px;
                }}
                .info-row {{
                    display: flex;
                    justify-content: space-between;
                    padding: 10px 0;
                    border-bottom: 1px solid #e0e0e0;
                }}
                .info-row:last-child {{
                    border-bottom: none;
                }}
                .label {{
                    font-weight: 600;
                    color: #666;
                }}
                .value {{
                    color: #333;
                    font-weight: 500;
                }}
                .refund-amount {{
                    background: #d4edda;
                    border: 2px solid #28a745;
                    border-radius: 8px;
                    padding: 20px;
                    text-align: center;
                    margin: 20px 0;
                }}
                .refund-amount .amount {{
                    font-size: 32px;
                    font-weight: bold;
                    color: #28a745;
                    margin: 10px 0;
                }}
                .refund-amount .label {{
                    color: #155724;
                    font-size: 14px;
                }}
                .message {{
                    background: #fff3cd;
                    border-left: 4px solid #ffc107;
                    padding: 15px;
                    margin: 20px 0;
                    border-radius: 4px;
                }}
                .footer {{
                    background: #f8f9fa;
                    padding: 20px;
                    text-align: center;
                    color: #666;
                    font-size: 14px;
                }}
                .footer a {{
                    color: #c41e3a;
                    text-decoration: none;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="icon">☕</div>
                    <h1>Order Cancellation Confirmation</h1>
                </div>
                
                <div class="content">
                    <p class="greeting">Hello {recipient_name},</p>
                    
                    <p>Your order has been successfully cancelled and the payment has been refunded to your account balance.</p>
                    
                    <div class="info-box">
                        <div class="info-row">
                            <span class="label">Order ID:</span>
                            <span class="value">#{order_id}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Cancelled Date:</span>
                            <span class="value">{datetime.now().strftime("%B %d, %Y at %I:%M %p")}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Status:</span>
                            <span class="value">✅ Refund Processed</span>
                        </div>
                    </div>
                    
                    <div class="refund-amount">
                        <div class="label">REFUNDED TO YOUR WALLET</div>
                        <div class="amount">{format_currency(refund_amount)}</div>
                        <div class="label">Available for your next order</div>
                    </div>
                    
                    <div class="message">
                        <strong>💰 Balance Updated!</strong><br>
                        The refund amount has been added to your account balance and is immediately available for future orders.
                    </div>
                    
                    <p style="margin-top: 30px;">If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
                    
                    <p>Thank you for your understanding!</p>
                </div>
                
                <div class="footer">
                    <p><strong>{SENDER_NAME}</strong></p>
                    <p>Questions? <a href="mailto:{SENDER_EMAIL}">Contact Support</a></p>
                    <p style="margin-top: 15px; color: #999; font-size: 12px;">
                        This is an automated email. Please do not reply directly to this message.
                    </p>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Attach HTML content
        html_part = MIMEText(html_content, 'html')
        msg.attach(html_part)
        
        # Connect to SMTP server and send email
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SENDER_EMAIL, SENDER_PASSWORD)
            server.send_message(msg)
        
        print(f"✅ Refund email sent to {recipient_email}")
        return True
        
    except Exception as e:
        print(f"❌ Failed to send email: {str(e)}")
        return False


def send_order_confirmation_email(recipient_email: str, recipient_name: str, order_id: str, total_amount: float, items_summary: str = ""):
    """
    Send order confirmation email (optional - for future use).
    
    Args:
        recipient_email: User's email
        recipient_name: User's name
        order_id: Order ID
        total_amount: Total order amount
        items_summary: Order items summary
    """
    # Can implement later if needed
    pass
