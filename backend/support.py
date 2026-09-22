from fastapi import APIRouter, Depends, HTTPException, Request
from security import verify_token
from auth import auth_rate_limiter, load_users
from pydantic import BaseModel, Field
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv
import aiosmtplib
import html
import logging
import os
import uuid
from datetime import datetime, timezone

load_dotenv()

logger = logging.getLogger(__name__)

router = APIRouter(dependencies=[Depends(verify_token)])

# Fixed support inbox. Not a secret; overridable via environment.
SUPPORT_EMAIL_DEFAULT = "Getsolarenergy14@gmail.com"

MAX_SUBJECT_LEN = 150
MAX_MESSAGE_LEN = 4000
MAX_NAME_LEN = 100


class SupportTicketRequest(BaseModel):
    subject: str = Field(min_length=1, max_length=MAX_SUBJECT_LEN)
    message: str = Field(min_length=1, max_length=MAX_MESSAGE_LEN)
    name: str = Field(default="", max_length=MAX_NAME_LEN)


def resolve_customer_name(user_email: str, client_name: str) -> str:
    """Display name only — identity always comes from the verified token."""
    try:
        users = load_users() or {}
        stored = (users.get(user_email) or {}).get("name", "")
        if isinstance(stored, str) and stored.strip():
            return stored.strip()[:MAX_NAME_LEN]
    except Exception:
        pass
    if client_name and client_name.strip():
        return " ".join(client_name.split())[:MAX_NAME_LEN]
    return user_email.split("@")[0]


def build_support_email(
    *,
    ticket_id: str,
    customer_name: str,
    customer_email: str,
    subject: str,
    message: str,
    submitted_at: str,
    support_email: str,
    smtp_from: str,
):
    safe_name = " ".join(customer_name.split())
    safe_subject = " ".join(subject.split())
    msg = MIMEMultipart("alternative")
    msg["From"] = smtp_from
    msg["To"] = support_email
    msg["Reply-To"] = customer_email
    msg["Subject"] = f"[GET Solar Support #{ticket_id}] {safe_subject}"

    text_body = f"""New customer support ticket #{ticket_id}

Customer: {safe_name}
Email: {customer_email}
Submitted (UTC): {submitted_at}
Subject: {safe_subject}

Message:
{message}
"""

    html_body = f"""<html><body style="font-family: Arial, sans-serif; color: #1e293b;">
<h2>New customer support ticket #{html.escape(ticket_id)}</h2>
<p><strong>Customer:</strong> {html.escape(safe_name)}<br>
<strong>Email:</strong> {html.escape(customer_email)}<br>
<strong>Submitted (UTC):</strong> {html.escape(submitted_at)}<br>
<strong>Subject:</strong> {html.escape(safe_subject)}</p>
<hr>
<p style="white-space: pre-wrap;">{html.escape(message)}</p>
</body></html>"""

    msg.attach(MIMEText(text_body, "plain"))
    msg.attach(MIMEText(html_body, "html"))
    return msg


async def send_support_email(msg) -> bool:
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "465"))
    smtp_user = os.getenv("SMTP_USERNAME", "devgetsolar@gmail.com")
    smtp_pass = os.getenv("SMTP_PASSWORD")

    for attempt in range(3):
        try:
            await aiosmtplib.send(
                msg,
                hostname=smtp_host,
                port=smtp_port,
                username=smtp_user,
                password=smtp_pass,
                use_tls=True,
                timeout=10,
            )
            return True
        except Exception as smtp_err:
            logger.warning("Support email dispatch attempt %d failed: %s", attempt + 1, str(smtp_err))
    return False


@router.post("/api/support/tickets")
async def create_support_ticket(
    data: SupportTicketRequest,
    req: Request = None,
    user_email: str = Depends(verify_token),
):
    client_ip = req.client.host if req else "unknown"
    if not auth_rate_limiter.is_allowed(user_email, client_ip):
        raise HTTPException(status_code=429, detail="Rate limit exceeded. Please try again later.")

    subject = data.subject.strip()
    message = data.message.strip()
    if not subject or not message:
        raise HTTPException(status_code=422, detail="Subject and message are required.")

    customer_name = resolve_customer_name(user_email, data.name or "")
    ticket_id = uuid.uuid4().hex[:10].upper()
    submitted_at = datetime.now(timezone.utc).isoformat()

    # Fixed destination — client input can never control the recipient.
    support_email = os.getenv("SUPPORT_EMAIL", SUPPORT_EMAIL_DEFAULT)
    smtp_from = os.getenv("SMTP_FROM", "GET Solar Support <devgetsolar@gmail.com>")

    msg = build_support_email(
        ticket_id=ticket_id,
        customer_name=customer_name,
        customer_email=user_email,
        subject=subject,
        message=message,
        submitted_at=submitted_at,
        support_email=support_email,
        smtp_from=smtp_from,
    )

    # Success is reported only after the SMTP provider accepts the email.
    if not await send_support_email(msg):
        logger.error("Support ticket %s email delivery failed for %s.", ticket_id, user_email)
        raise HTTPException(
            status_code=502,
            detail="Unable to send your support request right now. Please try again.",
        )

    logger.info("Support ticket %s dispatched to support inbox for %s.", ticket_id, user_email)
    return {"success": True, "ticket_id": ticket_id}
