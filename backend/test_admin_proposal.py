"""Admin customer proposal workflow tests (POST /api/admin/proposal/*).

Covers: admin-only access for all roles, unknown customer handling,
authoritative data loading, customer binding, input validation,
generation failure honesty, authoritative recipient send, cross-customer
send rejection, SMTP failure honesty, success-after-accept.
Self-cleaning: all sqlite rows created here are deleted in teardown.
"""
import uuid

import pytest
from fastapi.testclient import TestClient

from main import app
from security import create_access_token
from database_sqlite import SessionLocalSqlite as SessionLocal, CustomerModel
import admin_proposal as admin_proposal_module

client = TestClient(app, raise_server_exceptions=False)

EMAIL_ADMIN = "proposal.admin@getsolar.in"
EMAIL_CUSTOMER = "proposal.customer@getsolar.in"
EMAIL_VENDOR = "proposal.vendor@getsolar.in"
EMAIL_TECH = "proposal.tech@getsolar.in"


def headers(email, role="customer"):
    token = create_access_token({"sub": email, "email": email, "role": role})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def admin_headers(monkeypatch):
    """Unique admin identity per test so the shared rate limiter never trips."""
    admin_email = f"proposal.admin.{uuid.uuid4().hex[:8]}@getsolar.in"
    monkeypatch.setattr(
        admin_proposal_module, "has_admin_access", lambda email: email == admin_email
    )
    return headers(admin_email, "admin")


@pytest.fixture()
def customer_row():
    db = SessionLocal()
    suffix = uuid.uuid4().hex[:8]
    customer = CustomerModel(
        consumer_number=f"PROP-{suffix}", customer_name="Proposal Customer",
        discom="DVVNL", city="Lucknow", email=EMAIL_CUSTOMER, phone="9000000001",
        address="1 Solar Street",
    )
    db.add(customer)
    db.commit()
    db.refresh(customer)
    cid = customer.id
    yield cid
    db.query(CustomerModel).filter(CustomerModel.id == cid).delete()
    db.commit()
    db.close()


def valid_inputs(customer_id):
    return {
        "customer_id": customer_id,
        "customer_name": "Proposal Customer",
        "customer_address": "1 Solar Street",
        "city": "Lucknow",
        "monthly_units": 400,
        "monthly_bill_rs": 3200,
        "per_unit_rate": 8.0,
        "recommended_kw": 3,
        "roof_area_sqft": 400,
        "vendor_name": "Get Solar Energy",
    }


@pytest.fixture()
def ai_success(monkeypatch):
    import ai.provider_factory as factory

    class FakeProvider:
        def generate_response(self, request):
            class Resp:
                content = (
                    '{"customer_name": "Proposal Customer", "vendor_name": "Get Solar Energy", '
                    '"system_cost_rs": 150000, "subsidy_rs": 78000, "net_cost_rs": 72000, '
                    '"monthly_generation_units": 405, "monthly_savings_rs": 3240, '
                    '"annual_savings_rs": 38880, "payback_years": 1.9, '
                    '"savings_25_years_rs": 900000, "co2_offset_tons_per_year": 3.89, '
                    '"panels_required": 6, "executive_summary": "Summary.", '
                    '"system_overview": "Overview.", "financial_highlights": "Highlights.", '
                    '"why_choose_us": "Why.", "terms_and_conditions": ["a", "b", "c", "d", "e"]}'
                )

            return Resp()

        def get_model_name(self):
            return "fake-test"

    monkeypatch.setattr(factory, "_current_provider", FakeProvider())
    yield
    monkeypatch.setattr(factory, "_current_provider", None)


@pytest.fixture()
def ai_failure(monkeypatch):
    import ai.provider_factory as factory

    class FailProvider:
        def generate_response(self, request):
            raise RuntimeError("503 Service unavailable")

        def get_model_name(self):
            return "fail-test"

    monkeypatch.setattr(factory, "_current_provider", FailProvider())
    yield
    monkeypatch.setattr(factory, "_current_provider", None)


def mock_smtp_ok(monkeypatch, captured):
    async def fake_send(msg, **kwargs):
        captured["msg"] = msg
        return True
    monkeypatch.setattr(admin_proposal_module, "send_support_email", fake_send)


def mock_smtp_fail(monkeypatch):
    async def fake_send(msg, **kwargs):
        return False
    monkeypatch.setattr(admin_proposal_module, "send_support_email", fake_send)


def test_admin_roles_and_unauth(customer_row):
    cid = customer_row
    assert client.get(f"/api/admin/proposal/customer?customer_id={cid}").status_code == 401
    assert client.post("/api/admin/proposal/generate", json=valid_inputs(cid)).status_code == 401
    assert client.post("/api/admin/proposal/send", json={"customer_id": cid, "proposal": {}}).status_code == 401
    for email, role in [(EMAIL_CUSTOMER, "customer"), (EMAIL_VENDOR, "vendor"), (EMAIL_TECH, "technician")]:
        h = headers(email, role)
        assert client.get(f"/api/admin/proposal/customer?customer_id={cid}", headers=h).status_code == 403
        assert client.post("/api/admin/proposal/generate", json=valid_inputs(cid), headers=h).status_code == 403
        assert client.post("/api/admin/proposal/send", json={"customer_id": cid, "proposal": {}}, headers=h).status_code == 403


def test_unknown_customer(customer_row, admin_headers):
    assert client.get("/api/admin/proposal/customer?customer_id=999999", headers=admin_headers).status_code == 404
    res = client.post("/api/admin/proposal/generate", json=valid_inputs(999999), headers=admin_headers)
    assert res.status_code == 404


def test_customer_data_loaded(customer_row, admin_headers):
    cid = customer_row
    res = client.get(f"/api/admin/proposal/customer?customer_id={cid}", headers=admin_headers)
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["customer_id"] == cid
    assert data["customer_name"] == "Proposal Customer"
    assert data["email"] == EMAIL_CUSTOMER
    assert data["latest_bill"] is None


def test_missing_inputs_rejected(customer_row, admin_headers):
    bad = valid_inputs(customer_row)
    bad["monthly_bill_rs"] = 0
    res = client.post("/api/admin/proposal/generate", json=bad, headers=admin_headers)
    assert res.status_code == 422
    bad = valid_inputs(customer_row)
    bad["recommended_kw"] = 0
    res = client.post("/api/admin/proposal/generate", json=bad, headers=admin_headers)
    assert res.status_code == 422


def test_generation_failure_honest(customer_row, ai_failure, admin_headers):
    res = client.post("/api/admin/proposal/generate", json=valid_inputs(customer_row), headers=admin_headers)
    assert res.status_code == 502
    assert res.json().get("success") is not True


def test_generate_binds_customer(customer_row, ai_success, admin_headers):
    cid = customer_row
    res = client.post("/api/admin/proposal/generate", json=valid_inputs(cid), headers=admin_headers)
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["customer_id"] == cid
    assert data["customer_email"] == EMAIL_CUSTOMER
    assert data["proposal_reference"].startswith("PROP-")
    assert data["generated_by"].startswith("proposal.admin.")
    assert data["generated_by"].endswith("@getsolar.in")


def _generated(customer_row, admin_headers):
    res = client.post("/api/admin/proposal/generate", json=valid_inputs(customer_row), headers=admin_headers)
    assert res.status_code == 200
    return res.json()["data"]


def test_send_uses_authoritative_email(customer_row, ai_success, monkeypatch, admin_headers):
    cid = customer_row
    proposal = _generated(cid, admin_headers)
    captured = {}
    mock_smtp_ok(monkeypatch, captured)
    res = client.post("/api/admin/proposal/send", json={
        "customer_id": cid, "proposal": proposal,
    }, headers=admin_headers)
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert body["recipient"] == EMAIL_CUSTOMER
    assert captured["msg"]["To"] == EMAIL_CUSTOMER


def test_send_rejects_cross_customer(customer_row, ai_success, monkeypatch, admin_headers):
    cid = customer_row
    proposal = _generated(cid, admin_headers)
    proposal["customer_id"] = cid + 999999
    captured = {}
    mock_smtp_ok(monkeypatch, captured)
    res = client.post("/api/admin/proposal/send", json={
        "customer_id": cid, "proposal": proposal,
    }, headers=admin_headers)
    assert res.status_code == 422
    assert "msg" not in captured


def test_send_ignores_frontend_recipient(customer_row, ai_success, monkeypatch, admin_headers):
    cid = customer_row
    proposal = _generated(cid, admin_headers)
    captured = {}
    mock_smtp_ok(monkeypatch, captured)
    res = client.post("/api/admin/proposal/send", json={
        "customer_id": cid, "proposal": proposal,
        # No recipient field exists in the contract; even if injected it must not be honored.
        "recipient": "attacker@example.com", "email": "attacker@example.com",
    }, headers=admin_headers)
    assert res.status_code == 200
    assert res.json()["recipient"] == EMAIL_CUSTOMER
    assert captured["msg"]["To"] == EMAIL_CUSTOMER


def test_send_smtp_failure_honest(customer_row, ai_success, monkeypatch, admin_headers):
    cid = customer_row
    proposal = _generated(cid, admin_headers)
    mock_smtp_fail(monkeypatch)
    res = client.post("/api/admin/proposal/send", json={
        "customer_id": cid, "proposal": proposal,
    }, headers=admin_headers)
    assert res.status_code == 502
    assert res.json().get("success") is not True
