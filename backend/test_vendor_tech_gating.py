"""Vendor/Technician portal release-gate tests.

Vendor backend is admin-only for the current release. Technician backend
keeps its existing technician/admin scoping; only the identified gaps
(legacy troubleshoot, ratings POST, demo seeding) are gated.
Self-cleaning: all postgres rows created here are deleted in teardown.
"""
import uuid

import pytest
from fastapi.testclient import TestClient

from main import app
from security import create_access_token
from technician_auth import create_technician_token
from database import SessionLocal
from technician_models import Technician, JobPosting, WorkOrder
from performance_models import Rating
import vendor_inventory
import vendor_teams
import vendor_documents
import vendor_payments
import vendor_routes
import job_marketplace
import earnings

client = TestClient(app, raise_server_exceptions=False)

EMAIL_ADMIN = "gate.admin@getsolar.in"
EMAIL_CUSTOMER = "gate.customer@getsolar.in"
EMAIL_VENDOR = "gate.vendor@getsolar.in"
EMAIL_TECH = "gate.tech@getsolar.in"
EMAIL_ENGINEER = "gate.engineer@getsolar.in"

GATED_VENDOR_MODULES = [
    vendor_inventory, vendor_teams, vendor_documents,
    vendor_payments, vendor_routes, job_marketplace,
]


def main_headers(email, role="customer"):
    token = create_access_token({"sub": email, "email": email, "role": role})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(autouse=True)
def admin_gate(monkeypatch):
    for mod in GATED_VENDOR_MODULES + [earnings]:
        if hasattr(mod, "has_admin_access"):
            monkeypatch.setattr(mod, "has_admin_access", lambda email: email == EMAIL_ADMIN)
    yield


@pytest.fixture()
def tech_account():
    """Real technician row + token. Fully removed in teardown."""
    suffix = uuid.uuid4().hex[:8]
    email = f"gate.tech.{suffix}@getsolar.in"
    phone = f"90000{suffix[:5]}"
    db = SessionLocal()
    tech = Technician(
        uuid=f"gate-{suffix}", name="Gate Tech", phone=phone, email=email,
        password="x", city="Lucknow", skill_level="Level 1",
        kyc_status="Verified", is_active=True,
    )
    db.add(tech)
    db.commit()
    db.refresh(tech)
    tid = tech.id
    token = create_technician_token(tid, email, "technician")
    yield {"id": tid, "email": email, "headers": {"Authorization": f"Bearer {token}"}}
    db.query(Rating).filter(Rating.technician_id == tid).delete()
    db.query(Technician).filter(Technician.id == tid).delete()
    db.commit()
    db.close()


def admin_token():
    return create_technician_token(0, EMAIL_ADMIN, "admin")


ADMIN_TECH_HEADERS = {"Authorization": f"Bearer {admin_token()}"}


# ── Vendor endpoints: unauthenticated ────────────────────────────────
def test_vendor_unauth_rejected():
    assert client.get("/api/vendor/inventory?vendor_email=x").status_code == 401
    assert client.get("/api/vendor/team?vendor_email=x").status_code == 401
    assert client.get("/api/vendor/documents?vendor_email=x").status_code == 401
    assert client.get("/api/vendor/payouts?vendor_email=x").status_code == 401
    assert client.get("/api/vendor/dashboard").status_code == 401
    assert client.get("/api/vendor/projects").status_code == 401
    assert client.get("/api/jobs/post").status_code in (401, 404, 405)


def _vendor_probe_paths():
    return [
        ("GET", "/api/vendor/inventory?vendor_email=x@y.in"),
        ("GET", "/api/vendor/team?vendor_email=x@y.in"),
        ("GET", "/api/vendor/documents?vendor_email=x@y.in"),
        ("GET", "/api/vendor/payouts?vendor_email=x@y.in"),
        ("GET", "/api/vendor/dashboard"),
        ("GET", "/api/vendor/projects"),
        ("GET", "/api/vendor/tasks"),
        ("GET", "/api/vendor/alerts"),
    ]


# ── Vendor endpoints: customer/vendor/tech/engineer denied ───────────
@pytest.mark.parametrize("email,role", [
    (EMAIL_CUSTOMER, "customer"),
    (EMAIL_VENDOR, "vendor"),
    (EMAIL_TECH, "technician"),
    (EMAIL_ENGINEER, "engineer"),
])
def test_vendor_non_admin_denied(email, role):
    h = main_headers(email, role)
    for method, path in _vendor_probe_paths():
        res = client.request(method, path, headers=h)
        assert res.status_code == 403, f"{method} {path} as {role} -> {res.status_code}"


def test_vendor_writes_denied_for_non_admin():
    h = main_headers(EMAIL_VENDOR, "vendor")
    assert client.post("/api/vendor/inventory", json={
        "vendor_email": EMAIL_VENDOR, "product_name": "X", "quantity": 1,
    }, headers=h).status_code == 403
    assert client.post("/api/vendor/team", json={
        "vendor_email": EMAIL_VENDOR, "name": "Y",
    }, headers=h).status_code == 403
    assert client.post("/api/jobs/post", json={
        "vendor_email": EMAIL_VENDOR, "title": "T", "job_type": "Installation", "city": "Lucknow",
    }, headers=h).status_code == 403
    assert client.put("/api/vendor/payouts/1", json={"status": "Paid"}, headers=h).status_code == 403
    assert client.get("/api/vendor/payouts/1/receipt", headers=h).status_code == 403
    assert client.get("/api/jobs/1/applications", headers=h).status_code == 403


# ── Vendor endpoints: admin allowed, no leaks ────────────────────────
def test_vendor_admin_allowed_and_scoped():
    h = main_headers(EMAIL_ADMIN, "admin")
    res = client.get("/api/vendor/inventory?vendor_email=nobody@getsolar.in", headers=h)
    assert res.status_code == 200
    assert res.json()["items"] == []
    res = client.get("/api/vendor/team?vendor_email=nobody@getsolar.in", headers=h)
    assert res.status_code == 200
    assert res.json()["members"] == []
    res = client.get("/api/vendor/dashboard", headers=h)
    assert res.status_code == 200
    # Admin inventory write + delete round-trip leaves no rows behind
    res = client.post("/api/vendor/inventory", json={
        "vendor_email": EMAIL_ADMIN, "product_name": "Gate Panel", "quantity": 2,
    }, headers=h)
    assert res.status_code in (200, 201)
    item_id = res.json()["item"]["id"]
    try:
        # Cross-vendor IDOR probe as non-admin on the fresh row
        hv = main_headers(EMAIL_VENDOR, "vendor")
        assert client.get(f"/api/vendor/inventory/{item_id}", headers=hv).status_code == 403
        assert client.put(f"/api/vendor/inventory/{item_id}", json={"quantity": 9}, headers=hv).status_code == 403
    finally:
        assert client.delete(f"/api/vendor/inventory/{item_id}", headers=h).status_code == 200


def test_vendor_enumeration_blocked():
    hv = main_headers(EMAIL_VENDOR, "vendor")
    assert client.get("/api/jobs/1/applications", headers=hv).status_code == 403
    assert client.post("/api/jobs/post", json={
        "vendor_email": "spoof@evil.in", "title": "Hijack",
        "job_type": "Installation", "city": "Lucknow",
    }, headers=hv).status_code == 403


def test_vendor_malformed_write_is_noop():
    # Body validation runs before the handler: a bodiless write is a 422
    # no-op, never a data access or mutation.
    hv = main_headers(EMAIL_VENDOR, "vendor")
    assert client.put("/api/vendor/payouts/1", headers=hv).status_code == 422


# ── Technician endpoints ─────────────────────────────────────────────
def test_tech_unauth_rejected(tech_account):
    assert client.get("/api/technician/work-orders").status_code in (401, 403)
    assert client.post("/api/technician/ai/troubleshoot", json={"query": "E04"}).status_code in (401, 403)
    assert client.post("/api/technician/ratings/1", json={"rating": 5}).status_code in (401, 403)


def test_tech_customer_vendor_engineer_denied(tech_account):
    for email, role in [(EMAIL_CUSTOMER, "customer"), (EMAIL_VENDOR, "vendor"), (EMAIL_ENGINEER, "engineer")]:
        h = main_headers(email, role)
        assert client.get("/api/technician/work-orders", headers=h).status_code == 403
        assert client.post("/api/technician/ai/troubleshoot", json={"query": "E04"}, headers=h).status_code == 403
        assert client.post("/api/technician/ratings/1", json={"rating": 5}, headers=h).status_code == 403
        assert client.get("/api/technician/earnings", headers=h).status_code == 403


def test_tech_allowed_where_intended(tech_account):
    h = tech_account["headers"]
    assert client.get("/api/technician/work-orders", headers=h).status_code == 200
    assert client.get("/api/technician/earnings", headers=h).status_code == 200
    res = client.post("/api/technician/ai/troubleshoot", json={"query": "E04 error"}, headers=h)
    assert res.status_code == 200
    assert res.json()["success"] is True
    assert client.get("/api/technician/dashboard", headers=h).status_code == 200


def test_tech_admin_allowed(tech_account):
    assert client.get("/api/technician/work-orders", headers=ADMIN_TECH_HEADERS).status_code == 200
    assert client.get("/api/technician/earnings", headers=ADMIN_TECH_HEADERS).status_code == 200


def test_tech_rating_scoped_to_own_work(tech_account):
    db = SessionLocal()
    job = JobPosting(
        vendor_email=EMAIL_ADMIN, title="Gate Job", job_type="Installation",
        city="Lucknow", status="Completed",
    )
    db.add(job)
    db.flush()
    from technician_models import WorkOrder as WO
    wo = WO(job_id=job.id, technician_id=tech_account["id"], status="Completed")
    db.add(wo)
    db.commit()
    db.refresh(wo)
    wid = wo.id
    jid = job.id
    try:
        h = tech_account["headers"]
        res = client.post(f"/api/technician/ratings/{wid}", json={"rating": 5}, headers=h)
        assert res.status_code == 200
        # Second rating on same work order is rejected (no duplicates)
        res = client.post(f"/api/technician/ratings/{wid}", json={"rating": 4}, headers=h)
        assert res.status_code == 400
    finally:
        db.query(Rating).filter(Rating.work_order_id == wid).delete()
        db.query(WO).filter(WO.id == wid).delete()
        db.query(JobPosting).filter(JobPosting.id == jid).delete()
        db.commit()
        db.close()


def test_seed_demo_data_admin_only(tech_account):
    h = tech_account["headers"]
    assert client.post("/api/technician/earnings/seed-demo-data", headers=h).status_code == 403
    hc = main_headers(EMAIL_CUSTOMER, "customer")
    assert client.post("/api/technician/earnings/seed-demo-data", headers=hc).status_code in (401, 403)
    assert client.post("/api/technician/earnings/seed-demo-data").status_code in (401, 403)
