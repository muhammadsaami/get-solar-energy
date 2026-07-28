import json
import os


ADMIN_EMAILS_FILE = "admin_emails.json"


def _load_admin_emails():
    if not os.path.exists(ADMIN_EMAILS_FILE):
        return set()
    try:
        with open(ADMIN_EMAILS_FILE) as f:
            data = json.load(f)
            return set(data.get("emails", []))
    except (json.JSONDecodeError, IOError):
        return set()


def has_admin_access(user_email: str) -> bool:
    admin_emails = _load_admin_emails()
    return user_email in admin_emails
