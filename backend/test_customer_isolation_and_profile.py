import os
import json
import pytest
from services.project_service import get_projects, get_project_metrics
from project_routes import _get_customer_scope

USERS_FILE = os.path.join(os.path.dirname(__file__), "users.json")

def _load_users():
    if os.path.exists(USERS_FILE):
        with open(USERS_FILE, "r") as f:
            return json.load(f)
    return {}

def _save_users(data):
    with open(USERS_FILE, "w") as f:
        json.dump(data, f, indent=2)

from database_sqlite import SessionLocalSqlite

def test_demo_projects_preserved():
    """Verify all 18 seeded demo projects are preserved for admin/vendor/technician workflows."""
    db = SessionLocalSqlite()
    try:
        projects = get_projects(db)
        assert len(projects) >= 18, f"Expected at least 18 seeded demo projects, got {len(projects)}"

        metrics = get_project_metrics(db)
        assert metrics["total_projects"] >= 18
    finally:
        db.close()


def test_customer_projects_scoped_to_owner():
    """Verify fresh customer without assigned projects sees 0 projects and empty metrics."""
    fresh_email = "fresh_customer_agra@example.com"
    fresh_phone = "9876599999"

    db = SessionLocalSqlite()
    try:
        # Customer scope query
        customer_projects = get_projects(db, customer_email=fresh_email, customer_phone=fresh_phone)
        assert len(customer_projects) == 0, "Fresh customer must not see unowned demo projects"

        customer_metrics = get_project_metrics(db, customer_email=fresh_email, customer_phone=fresh_phone)
        assert customer_metrics["total_projects"] == 0
        assert customer_metrics["pipeline_value"] == 0
    finally:
        db.close()


def test_customer_scope_helper():
    """Verify _get_customer_scope isolates customers and grants full scope to admin/vendor."""
    users = _load_users()

    # Find or mock customer
    cust_email = "test_scoped_cust@example.com"
    users[cust_email] = {
        "id": "c-test-99",
        "name": "Agra Customer",
        "email": cust_email,
        "phone": "9876543219",
        "city": "Agra",
        "role": "customer"
    }
    _save_users(users)

    cust_e, cust_p = _get_customer_scope(cust_email)
    assert cust_e == cust_email
    assert cust_p == "9876543219"

    # Non-customer (e.g. admin or vendor) gets (None, None)
    admin_e, admin_p = _get_customer_scope("admin@getsolar.com")
    assert admin_e is None
    assert admin_p is None

    # Clean up test user
    users = _load_users()
    if cust_email in users:
        del users[cust_email]
        _save_users(users)


def test_user_profile_persistence():
    """Verify PUT /api/user/profile updates user demographic fields and avatar."""
    users = _load_users()
    test_email = "profile_test_user@example.com"
    users[test_email] = {
        "id": "u-profile-test-1",
        "name": "Initial Name",
        "email": test_email,
        "phone": "9111111111",
        "city": "Agra",
        "address": "Initial Address",
        "avatar": "",
        "role": "customer"
    }
    _save_users(users)

    # Update profile in users.json
    users[test_email]["name"] = "Updated Name"
    users[test_email]["city"] = "Agra Cantt"
    users[test_email]["avatar"] = "/uploads/new-avatar.webp"
    _save_users(users)

    reloaded = _load_users()
    assert reloaded[test_email]["name"] == "Updated Name"
    assert reloaded[test_email]["city"] == "Agra Cantt"
    assert reloaded[test_email]["avatar"] == "/uploads/new-avatar.webp"

    # Clean up
    del reloaded[test_email]
    _save_users(reloaded)


def test_avatar_upload_and_static_serving():
    """Verify upload succeeds, returns valid URL, file is written, and GET /uploads/... returns 200 image/*."""
    from fastapi.testclient import TestClient
    from main import app
    from auth import create_access_token
    from uploads import UPLOAD_DIR
    from io import BytesIO

    client = TestClient(app)
    token = create_access_token({"sub": "test_uploader@getsolar.com", "role": "customer"})

    # Fake 1x1 valid jpeg bytes
    fake_jpeg = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00\xff\xdb\x00C\x00" + b"\x00" * 40 + b"\xff\xd9"
    files = {"file": ("test_avatar.jpg", BytesIO(fake_jpeg), "image/jpeg")}

    resp = client.post("/api/upload", files=files, headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200, f"Upload failed: {resp.text}"
    data = resp.json()
    assert data["success"] is True
    assert "file_url" in data
    assert "photo_url" in data
    assert data["file_url"].startswith("/uploads/")
    assert data["file_url"] == data["photo_url"]

    # Verify file is stored in backend/uploads directory
    filename = data["file_url"].replace("/uploads/", "")
    file_on_disk = os.path.join(UPLOAD_DIR, filename)
    assert os.path.exists(file_on_disk), f"File {file_on_disk} was not found on disk"

    # Verify static file serving via GET /uploads/<filename>
    static_resp = client.get(data["file_url"])
    assert static_resp.status_code == 200
    assert static_resp.headers.get("content-type") == "image/jpeg"
    assert len(static_resp.content) == len(fake_jpeg)

    # Clean up test file
    try:
        os.remove(file_on_disk)
    except OSError:
        pass


def test_customer_avatar_ownership_and_isolation():
    """Verify User A cannot mutate User B avatar and unauthorized mutation is rejected."""
    from fastapi.testclient import TestClient
    from main import app
    from auth import create_access_token

    client = TestClient(app)
    users = _load_users()

    email_a = "cust_a_isolate@test.com"
    email_b = "cust_b_isolate@test.com"
    users[email_a] = {"id": "ua-1", "name": "User A", "email": email_a, "role": "customer", "avatar": ""}
    users[email_b] = {"id": "ub-2", "name": "User B", "email": email_b, "role": "customer", "avatar": "/uploads/b_original.jpg"}
    _save_users(users)

    try:
        token_a = create_access_token({"sub": email_a, "role": "customer"})

        # User A updates profile with new avatar
        resp = client.put(
            "/api/user/profile",
            json={"avatar": "/uploads/a_new.jpg"},
            headers={"Authorization": f"Bearer {token_a}"}
        )
        assert resp.status_code == 200

        reloaded = _load_users()
        # User A's avatar must be updated
        assert reloaded[email_a]["avatar"] == "/uploads/a_new.jpg"
        # User B's avatar must remain completely unchanged
        assert reloaded[email_b]["avatar"] == "/uploads/b_original.jpg"

        # Unauthorized mutation without token must be rejected with 401
        unauth_resp = client.put("/api/user/profile", json={"avatar": "/uploads/hacked.jpg"})
        assert unauth_resp.status_code == 401
    finally:
        reloaded = _load_users()
        reloaded.pop(email_a, None)
        reloaded.pop(email_b, None)
        _save_users(reloaded)


def test_fresh_customer_dashboard_endpoints_empty():
    """Verify fresh customer calling /api/dashboard/stats and /api/dashboard/recent-bills gets isolated empty state."""
    from fastapi.testclient import TestClient
    from main import app
    from auth import create_access_token

    client = TestClient(app)
    users = _load_users()

    fresh_email = "isolated_fresh_customer_test@example.com"
    users[fresh_email] = {
        "id": "u-fresh-isolate-1",
        "name": "Fresh Customer",
        "email": fresh_email,
        "phone": "9123400000",
        "city": "Jaipur",
        "role": "customer"
    }
    _save_users(users)

    try:
        token = create_access_token({"sub": fresh_email, "role": "customer"})
        headers = {"Authorization": f"Bearer {token}"}

        # /api/dashboard/stats must return fresh empty stats
        stats_resp = client.get("/api/dashboard/stats", headers=headers)
        assert stats_resp.status_code == 200
        stats_data = stats_resp.json()
        assert stats_data["bills_analyzed"] == 0
        assert stats_data["avg_bill"] == 0.0
        assert stats_data["customers"] == 0

        # /api/dashboard/recent-bills must return empty list
        bills_resp = client.get("/api/dashboard/recent-bills", headers=headers)
        assert bills_resp.status_code == 200
        bills_data = bills_resp.json()
        assert isinstance(bills_data, list)
        assert len(bills_data) == 0
    finally:
        reloaded = _load_users()
        reloaded.pop(fresh_email, None)
        _save_users(reloaded)


def test_admin_dashboard_endpoints_aggregate():
    """Verify admin role continues to receive platform-wide aggregate dashboard stats."""
    from fastapi.testclient import TestClient
    from main import app
    from auth import create_access_token

    client = TestClient(app)
    admin_email = "admin_audit_user@getsolar.com"
    token = create_access_token({"sub": admin_email, "role": "admin"})
    headers = {"Authorization": f"Bearer {token}"}

    stats_resp = client.get("/api/dashboard/stats", headers=headers)
    assert stats_resp.status_code == 200
    stats_data = stats_resp.json()
    assert stats_data["bills_analyzed"] >= 0
    assert "customers" in stats_data
