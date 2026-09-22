import json
import os

USERS_FILE = "users.json"


def has_admin_access(user_email: str) -> bool:
    if not os.path.exists(USERS_FILE):
        return False
    try:
        with open(USERS_FILE, encoding="utf-8") as f:
            users = json.load(f)
        user = users.get(user_email)
        if user and user.get("role") in ("admin", "Administrator"):
            return True
    except (json.JSONDecodeError, IOError):
        pass
    return False


def get_user_role(user_email: str) -> str:
    """
    Minimal role bridge for release-gate authorization.

    Returns the stored role for the email, defaulting to "customer".
    Mirrors the has_admin_access lookup pattern only; users.json is not
    a new source of truth and must never be written by callers.
    """
    if not os.path.exists(USERS_FILE):
        return "customer"
    try:
        with open(USERS_FILE, encoding="utf-8") as f:
            users = json.load(f)
        user = users.get(user_email)
        role = (user.get("role") if isinstance(user, dict) else None) or "customer"
        return str(role).strip().lower() or "customer"
    except (json.JSONDecodeError, IOError, AttributeError):
        return "customer"