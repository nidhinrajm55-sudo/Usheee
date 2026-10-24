"""
Real-world Outbound Notification Gateway for Tracer.
Supports live SMTP (Gmail, Outlook, custom SMTP) and cellular SMS (Fast2SMS for India, Twilio, or free mobile web pager).
"""
import os
import smtplib
import urllib.request
import json
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime, timezone
from typing import Dict, Any, Tuple
from pathlib import Path
from dotenv import load_dotenv

ENV_PATH = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=ENV_PATH)

def get_gateway_config() -> Dict[str, Any]:
    """Returns current gateway configuration state (masks secrets)."""
    smtp_pass = os.getenv("SMTP_PASS", "")
    fast2sms_key = os.getenv("FAST2SMS_API_KEY", "")
    twilio_token = os.getenv("TWILIO_AUTH_TOKEN", "")

    return {
        "smtp": {
            "host": os.getenv("SMTP_HOST", "smtp.gmail.com"),
            "port": int(os.getenv("SMTP_PORT", "587")),
            "user": os.getenv("SMTP_USER", "priyaljoshi2153@gmail.com"),
            "has_password": bool(smtp_pass),
            "masked_pass": "••••••••••••••••" if smtp_pass else "",
            "is_ready": bool(os.getenv("SMTP_USER") and smtp_pass)
        },
        "sms": {
            "fast2sms_ready": bool(fast2sms_key),
            "masked_fast2sms": (fast2sms_key[:4] + "••••" + fast2sms_key[-4:]) if len(fast2sms_key) > 8 else ("••••" if fast2sms_key else ""),
            "twilio_ready": bool(os.getenv("TWILIO_ACCOUNT_SID") and twilio_token and os.getenv("TWILIO_FROM_NUMBER")),
            "instant_pager_topic": "https://ntfy.sh/tracer_9074121510",
            "is_ready": bool(fast2sms_key or (os.getenv("TWILIO_ACCOUNT_SID") and twilio_token))
        }
    }

def update_gateway_config(config: Dict[str, str]) -> Dict[str, Any]:
    """Updates in-memory environment variables and persists them to the .env file."""
    lines = []
    if ENV_PATH.exists():
        with open(ENV_PATH, "r", encoding="utf-8") as f:
            lines = f.readlines()

    existing = {}
    for line in lines:
        line_clean = line.strip()
        if line_clean and not line_clean.startswith("#") and "=" in line_clean:
            k, v = line_clean.split("=", 1)
            existing[k.strip()] = v.strip()

    # Update fields from config
    for k, v in config.items():
        if v is not None and v != "":
            existing[k] = v
            os.environ[k] = v

    # Write back to .env
    with open(ENV_PATH, "w", encoding="utf-8") as f:
        f.write("# Tracer Outbound Notification Gateway Credentials\n")
        f.write("# Generated automatically\n\n")
        for k, v in existing.items():
            f.write(f"{k}={v}\n")

    return get_gateway_config()

def send_real_smtp_email(
    recipient_email: str,
    recipient_name: str,
    subject: str,
    report_data: Dict[str, Any]
) -> Tuple[bool, str]:
    """
    Attempts real outbound SMTP delivery to recipient's Gmail inbox.
    Requires Gmail App Password or valid SMTP relay credentials.
    """
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER", "")
    smtp_pass = os.getenv("SMTP_PASS", "")

    if not smtp_user or not smtp_pass:
        return False, "SMTP credentials not configured. Please enter your Gmail App Password in Gateway Settings to send real emails to your inbox."

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"Tracer Incident Sentinel <{smtp_user}>"
    msg["To"] = recipient_email

    asset_name = report_data.get("target_asset") or report_data.get("asset_id", "Data Pipeline Node")
    msg_body = report_data.get("message") or report_data.get("root_cause_explanation") or "Incident breakdown flagged on pipeline node."

    body_text = f"""
TRACER PIPELINE VILLAGE - INCIDENT NOTIFICATION
===============================================
Recipient: {recipient_name} ({recipient_email})
Target Asset: {asset_name}
Timestamp: {datetime.now(timezone.utc).isoformat()}

Incident Details:
{msg_body}

Report ID: {report_data.get('id', 'N/A')}
-----------------------------------------------
Dispatched live by Tracer AI Incident Agent.
"""

    body_html = f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background: #ffffff;">
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px;">
        <span style="font-size: 24px;">🚨</span>
        <h2 style="color: #0f172a; margin: 0; font-size: 18px;">Tracer Incident Alert: {asset_name}</h2>
      </div>
      <div style="background: #fff1f2; border: 1px solid #fecdd3; border-radius: 12px; padding: 16px; margin: 16px 0;">
        <strong style="color: #be123c; font-size: 13px; display: block; margin-bottom: 6px;">Automated Diagnostic Dispatch</strong>
        <p style="margin: 0; font-size: 13px; color: #475569; line-height: 1.5;">{msg_body}</p>
      </div>
      <div style="font-size: 11px; color: #64748b; border-top: 1px solid #f1f5f9; padding-top: 12px; margin-top: 20px;">
        Dispatched to On-Call Commander: <strong>{recipient_name}</strong> ({recipient_email})<br>
        Delivery route: TLS 1.3 Direct Outbound SMTP Relay
      </div>
    </div>
    """

    msg.attach(MIMEText(body_text, "plain"))
    msg.attach(MIMEText(body_html, "html"))

    try:
        with smtplib.SMTP(smtp_host, smtp_port, timeout=12) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.send_message(msg)
            return True, f"Successfully dispatched authentic live email to {recipient_email} via {smtp_host}:{smtp_port}"
    except smtplib.SMTPAuthenticationError:
        return False, "Gmail authentication failed. Make sure to use a 16-character Google App Password (not your normal Gmail account password)."
    except Exception as e:
        return False, f"SMTP Connection error: {str(e)}"

def send_real_cellular_sms(
    recipient_phone: str,
    message: str
) -> Tuple[bool, str]:
    """
    Attempts real SMS delivery to cellular network (Fast2SMS for India or Twilio).
    Always triggers instant web push on ntfy.sh as well.
    """
    cleaned_phone = "".join(filter(str.isdigit, recipient_phone))
    if cleaned_phone.startswith("91") and len(cleaned_phone) == 12:
        cleaned_phone = cleaned_phone[2:] # 10 digits

    # Broadcast to live mobile web push topic so phone vibrates/alerts without signup
    web_push_success = False
    try:
        topic = f"tracer_{cleaned_phone}"
        push_url = f"https://ntfy.sh/{topic}"
        req = urllib.request.Request(
            push_url,
            data=message.encode("utf-8"),
            headers={
                "Title": "🚨 [P0 SOS TRACER ALERT]",
                "Priority": "5",
                "Tags": "rotating_light,fire"
            }
        )
        with urllib.request.urlopen(req, timeout=5) as res:
            if res.status == 200:
                web_push_success = True
    except Exception:
        pass

    # 1. Fast2SMS (India Bulk SMS API)
    fast2sms_key = os.getenv("FAST2SMS_API_KEY", "")
    if fast2sms_key:
        try:
            url = "https://www.fast2sms.com/dev/bulkV2"
            headers = {
                "authorization": fast2sms_key,
                "Content-Type": "application/x-www-form-urlencoded"
            }
            data = urllib.parse.urlencode({
                "route": "q",
                "message": message[:150],
                "flash": "0",
                "numbers": cleaned_phone
            }).encode("utf-8")
            req = urllib.request.Request(url, data=data, headers=headers)
            with urllib.request.urlopen(req, timeout=8) as response:
                res_data = json.loads(response.read().decode())
                if res_data.get("return") is True:
                    return True, f"Cellular SMS sent to {recipient_phone} via Fast2SMS."
                else:
                    return False, f"Fast2SMS error: {res_data.get('message', 'Rejected by gateway')}"
        except Exception as e:
            return False, f"Fast2SMS API call failed: {str(e)}"

    # 2. Twilio (Global SMS API)
    twilio_sid = os.getenv("TWILIO_ACCOUNT_SID", "")
    twilio_token = os.getenv("TWILIO_AUTH_TOKEN", "")
    twilio_from = os.getenv("TWILIO_FROM_NUMBER", "")
    if twilio_sid and twilio_token and twilio_from:
        try:
            import base64
            to_num = recipient_phone if recipient_phone.startswith("+") else f"+91{cleaned_phone}"
            url = f"https://api.twilio.com/2010-04-01/Accounts/{twilio_sid}/Messages.json"
            auth_str = base64.b64encode(f"{twilio_sid}:{twilio_token}".encode()).decode()
            headers = {
                "Authorization": f"Basic {auth_str}",
                "Content-Type": "application/x-www-form-urlencoded"
            }
            data = urllib.parse.urlencode({
                "From": twilio_from,
                "To": to_num,
                "Body": message[:160]
            }).encode("utf-8")
            req = urllib.request.Request(url, data=data, headers=headers)
            with urllib.request.urlopen(req, timeout=8) as response:
                if response.status in [200, 201]:
                    return True, f"Cellular SMS sent to {to_num} via Twilio."
                else:
                    return False, f"Twilio returned HTTP {response.status}"
        except Exception as e:
            return False, f"Twilio API call failed: {str(e)}"

    if web_push_success:
        return False, f"Cellular SMS API Key not configured. Instant live mobile alert was broadcast to phone topic https://ntfy.sh/tracer_{cleaned_phone}"

    return False, "Cellular SMS API credentials missing. Provide Fast2SMS or Twilio API key in Gateway Settings."
