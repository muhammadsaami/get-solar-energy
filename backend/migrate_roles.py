import json
import os

USERS_FILE = "users.json"

def migrate():
    if not os.path.exists(USERS_FILE):
        print("No users.json found. Nothing to migrate.")
        return

    with open(USERS_FILE, "r", encoding="utf-8") as f:
        users = json.load(f)

    changed = 0
    for email, user in users.items():
        if "role" not in user or not user.get("role"):
            user["role"] = "customer"
            changed += 1
            print(f"  {email}: assigned role=customer")

    if changed:
        with open(USERS_FILE, "w", encoding="utf-8") as f:
            json.dump(users, f, indent=2, ensure_ascii=False)
        print(f"\nMigrated {changed} user(s).")
    else:
        print("All users already have a role. Nothing to migrate.")

if __name__ == "__main__":
    migrate()
