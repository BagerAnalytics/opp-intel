import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def send_email_notification(subject: str, html_body: str, to_email: str = "premieragric1@gmail.com"):
    """
    Sends an HTML email notification. 
    Defaults to premieragric1@gmail.com as requested by the user.
    """
    smtp_user = os.environ.get("SMTP_USER")
    smtp_pass = os.environ.get("SMTP_PASS")
    
    if not smtp_user or not smtp_pass:
        print(f"[Email Service] DRY RUN: Would have sent email to {to_email}")
        print(f"Subject: {subject}")
        print("To activate live emails, add SMTP_USER and SMTP_PASS to Railway environment variables.")
        return False
        
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"OppIntel Platform <{smtp_user}>"
    msg["To"] = to_email
    
    msg.attach(MIMEText(html_body, "html"))
    
    try:
        # Assuming Gmail SMTP. Change to smtp.premieragric.co.za if using custom domain.
        smtp_host = os.environ.get("SMTP_HOST", "smtp.gmail.com")
        smtp_port = int(os.environ.get("SMTP_PORT", "587"))
        
        server = smtplib.SMTP(smtp_host, smtp_port)
        server.ehlo()
        server.starttls()
        server.login(smtp_user, smtp_pass)
        server.sendmail(smtp_user, to_email, msg.as_string())
        server.close()
        print(f"[Email Service] Successfully sent email to {to_email}")
        return True
    except Exception as e:
        print(f"[Email Service] Failed to send email: {e}")
        return False

def notify_new_opportunities(count: int, portal_name: str = "Various Portals"):
    subject = f"🔔 OppIntel: {count} New Opportunities Found"
    html = f"""
    <html>
      <body style="font-family: Arial, sans-serif; color: #333;">
        <div style="max-w: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #007AFF;">Opportunity Intelligence Alert</h2>
          <p>The AI Engine has just finished scraping <strong>{portal_name}</strong>.</p>
          <p>We successfully extracted and scored <strong>{count}</strong> new opportunities matching your compliance profile!</p>
          <br/>
          <a href="https://opp-intel-production.up.railway.app" style="background-color: #10B981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Dashboard</a>
          <br/><br/>
          <p style="font-size: 12px; color: #999;">Automated message from Premier Agric & Badger Analytics</p>
        </div>
      </body>
    </html>
    """
    return send_email_notification(subject, html)

def notify_scraper_error(error_message: str):
    subject = "⚠️ OppIntel: Scraper Engine Error"
    html = f"""
    <html>
      <body style="font-family: Arial, sans-serif; color: #333;">
        <div style="max-w: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; border-top: 5px solid #EF4444;">
          <h2 style="color: #EF4444;">Scraper Engine Failure</h2>
          <p>The scheduled AI scraping task encountered a critical error and aborted.</p>
          <div style="background-color: #f8d7da; padding: 15px; border-radius: 5px; font-family: monospace;">
            {error_message}
          </div>
          <p>Please check the Railway backend logs for more details.</p>
        </div>
      </body>
    </html>
    """
    return send_email_notification(subject, html)

def notify_groq_expiry(days_left: int):
    subject = f"⚠️ OppIntel: Groq API Key Expires in {days_left} Days"
    html = f"""
    <html>
      <body style="font-family: Arial, sans-serif; color: #333;">
        <div style="max-w: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; border-top: 5px solid #F59E0B;">
          <h2 style="color: #F59E0B;">Action Required: API Key Expiry</h2>
          <p>The free Groq Llama 3 API key powering your extraction engine will expire in <strong>{days_left} days</strong>.</p>
          <p>To ensure uninterrupted service, please log into <a href="https://console.groq.com">console.groq.com</a>, generate a new free key, and update the <code>GROQ_API_KEY</code> and <code>GROQ_KEY_ADDED_DATE</code> variables in your Railway dashboard.</p>
        </div>
      </body>
    </html>
    """
    return send_email_notification(subject, html)
