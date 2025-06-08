import os
import logging
from typing import Optional
from fastapi import HTTPException

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        self.smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_username = os.getenv("SMTP_USERNAME")
        self.smtp_password = os.getenv("SMTP_PASSWORD")
        self.from_email = os.getenv("FROM_EMAIL", self.smtp_username)
        self.email_enabled = self._check_email_availability()
        
    def _check_email_availability(self):
        """Check if email functionality is available"""
        try:
            import smtplib
            from email.mime.text import MIMEText
            from email.mime.multipart import MIMEMultipart
            
            # Check if credentials are provided
            if not self.smtp_username or not self.smtp_password:
                logger.warning("Email credentials not provided. Email functionality disabled.")
                return False
                
            return True
        except ImportError as e:
            logger.warning(f"Email dependencies not available: {e}. Email functionality disabled.")
            return False
    
    def _get_smtp_connection(self):
        """Create SMTP connection"""
        if not self.email_enabled:
            raise HTTPException(status_code=500, detail="Email service not available")
            
        try:
            import smtplib
            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls()
            if self.smtp_username and self.smtp_password:
                server.login(self.smtp_username, self.smtp_password)
            return server
        except Exception as e:
            logger.error(f"Failed to connect to SMTP server: {e}")
            raise HTTPException(status_code=500, detail="Email service unavailable")
    
    def send_email(self, to_email: str, subject: str, html_content: str, text_content: Optional[str] = None):
        """Send email with HTML content"""
        if not self.email_enabled:
            logger.info(f"Email would be sent to {to_email} with subject: {subject}")
            return  # Silently skip if email is not enabled
            
        try:
            from email.mime.text import MIMEText
            from email.mime.multipart import MIMEMultipart
            
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = self.from_email
            msg['To'] = to_email
            
            # Add text version if provided
            if text_content:
                text_part = MIMEText(text_content, 'plain')
                msg.attach(text_part)
            
            # Add HTML version
            html_part = MIMEText(html_content, 'html')
            msg.attach(html_part)
            
            # Send email
            with self._get_smtp_connection() as server:
                server.send_message(msg)
                
            logger.info(f"Email sent successfully to {to_email}")
            
        except ImportError as e:
            logger.error(f"Email import error: {e}")
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {e}")
            # Don't raise exception - we don't want email failures to break registration
            pass
    
    def send_event_registration_confirmation(self, user_email: str, user_name: str, event_title: str, event_details: dict):
        """Send event registration confirmation email"""
        if not self.email_enabled:
            logger.info(f"Registration confirmation would be sent to {user_email} for event: {event_title}")
            return
            
        subject = f"Registration Confirmed: {event_title}"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{ font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f8f6f1; }}
                .container {{ max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }}
                .header {{ background-color: #66b2a0; color: white; padding: 30px; text-align: center; }}
                .content {{ padding: 30px; }}
                .event-details {{ background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; }}
                .button {{ display: inline-block; background-color: #4e796b; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; margin: 10px 0; }}
                .footer {{ background-color: #e1eae5; color: #4e796b; padding: 20px; text-align: center; font-size: 14px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎉 Registration Confirmed!</h1>
                </div>
                <div class="content">
                    <h2>Hello {user_name}!</h2>
                    <p>Great news! Your registration for <strong>{event_title}</strong> has been confirmed.</p>
                    
                    <div class="event-details">
                        <h3>📅 Event Details</h3>
                        <p><strong>Title:</strong> {event_title}</p>
                        <p><strong>Date:</strong> {event_details.get('start_date', 'TBD')}</p>
                        <p><strong>Location:</strong> {event_details.get('location', 'TBD')}</p>
                        <p><strong>Format:</strong> {event_details.get('format', 'TBD')}</p>
                        {f'<p><strong>Meeting Link:</strong> <a href="{event_details.get("meeting_link")}">{event_details.get("meeting_link")}</a></p>' if event_details.get('meeting_link') else ''}
                    </div>
                    
                    <p>We're excited to see you there! If you have any questions, please don't hesitate to reach out.</p>
                    
                    <div style="text-align: center;">
                        <a href="{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/app/events/{event_details.get('id')}" class="button">
                            View Event Details
                        </a>
                    </div>
                </div>
                <div class="footer">
                    <p>This email was sent from Bookify Events Platform</p>
                    <p>If you didn't register for this event, please ignore this email.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        text_content = f"""
        Registration Confirmed: {event_title}
        
        Hello {user_name}!
        
        Your registration for {event_title} has been confirmed.
        
        Event Details:
        - Title: {event_title}
        - Date: {event_details.get('start_date', 'TBD')}
        - Location: {event_details.get('location', 'TBD')}
        - Format: {event_details.get('format', 'TBD')}
        
        We're excited to see you there!
        
        View event details: {os.getenv('FRONTEND_URL', 'http://localhost:3000')}/app/events/{event_details.get('id')}
        """
        
        self.send_email(user_email, subject, html_content, text_content)

# Global email service instance
email_service = EmailService()