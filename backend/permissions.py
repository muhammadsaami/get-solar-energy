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