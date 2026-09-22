"""CRM + customer enumeration authorization regression tests.

Covers: unauthenticated rejection, unauthorized role/customer denial,
authorized owner + admin access, and customer A/B isolation.
Self-cleaning: all sqlite rows created here are deleted in teardown.
"""
import uuid

import pytest
from fastapi.testclient import TestClient

from main import app
from security import create_access_token
from database_sqlite import SessionLocalSqlite as SessionLocal, CustomerModel
from crm_models import CRMTaskModel
import crm_routes
import customer_routes

client = TestClient(app, raise_server_exceptions=False)

EMAIL_A = "crm.owner.a@getsolar.in"
EMAIL_B = "crm.owner.b@getsolar.in"
EMAIL_ADMIN = "crm.admin@getsolar.in"


def headers(email):
    token = create_access_token({"sub": email, "email": email, "role": "customer"})
    return {"Authorization": f"Bearer {token}"}


ADMIN_HEADERS = headers(EMAIL_ADMIN)


@pytest.fixture()
def two_customers(monkeypatch):
    """Two sqlite customers owned by A and B, plus one task for A. Cleans up after."""
    monkeypatch.setattr(crm_routes, "has_admin_access", lambda email: email == EMAIL_ADMIN)
    monkeypatch.setattr(customer_routes, "has_admin_access", lambda email: email == EMAIL_ADMIN)
    db = SessionLocal()
    suffix = uuid.uuid4().hex[:8]
    cust_a = CustomerModel(
        consumer_number=f"CRM-A-{suffix}", customer_name="CRM Owner A",
        discom="DVVNL", city="Lucknow", email=EMAIL_A,
    )
    cust_b = CustomerModel(
        consumer_number=f"CRM-B-{suffix}", customer_name="CRM Owner B",
        discom="DVVNL", city="Lucknow", email=EMAIL_B,
    )
    db.add_all([cust_a, cust_b])
    db.commit()
    db.refresh(cust_a)
    db.refresh(cust_b)
    task = CRMTaskModel(
        customer_id=cust_a.id, title="Owner A task", department="Support",
        priority="High", due_date="2026-12-01", status="Pending",
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    ids = {"a": cust_a.id, "b": cust_b.id, "task": task.id}
    yield ids
    db.query(CRMTaskModel).filter(CRMTaskModel.id == ids["task"]).delete()
    db.query(CustomerModel).filter(CustomerModel.id.in_([ids["a"], ids["b"]])).delete()
    db.commit()
    db.close()


def test_unauthenticated_crm_reads_rejected(two_customers):
    ids = two_customers
    assert client.get(f"/api/crm/customers/{ids['a']}/360").status_code == 401
    assert client.get(f"/api/crm/customers/{ids['a']}/amc").status_code == 401
    assert client.get(f"/api/crm/customers/{ids['a']}/payments").status_code == 401
    assert client.get("/api/crm/tasks").status_code == 401
    assert client.get("/api/crm/global-search?q=test").status_code == 401
    assert client.get("/api/crm/pipeline-metrics").status_code == 401
    assert client.get("/api/customers").status_code == 401


def test_cross_customer_denied(two_customers):
    ids = two_customers
    hb = headers(EMAIL_B)
    # Reads of A's data as B -> 404 (no existence oracle)
    assert client.get(f"/api/crm/customers/{ids['a']}/360", headers=hb).status_code == 404
    assert client.get(f"/api/crm/timeline/{ids['a']}", headers=hb).status_code == 404
    assert client.get(f"/api/crm/customers/{ids['a']}/amc", headers=hb).status_code == 404
    assert client.get(f"/api/crm/customers/{ids['a']}/payments", headers=hb).status_code == 404
    assert client.get(f"/api/crm/customers/{ids['a']}/documents", headers=hb).status_code == 404
    assert client.get(f"/api/customers/{ids['a']}", headers=hb).status_code == 404
    # Writes against A's data as B -> denied
    assert client.put(f"/api/crm/tasks/{ids['task']}", json={"status": "Completed"}, headers=hb).status_code == 404
    assert client.delete(f"/api/crm/tasks/{ids['task']}", headers=hb).status_code == 404
    assert client.post("/api/crm/tasks", json={
        "customer_id": ids["a"], "title": "Hijack", "department": "Support",
        "priority": "Low", "due_date": "2026-12-02",
    }, headers=hb).status_code == 404
    assert client.put(f"/api/customers/{ids['a']}", json={"city": "Agra"}, headers=hb).status_code == 404


def test_owner_access(two_customers):
    ids = two_customers
    ha = headers(EMAIL_A)
    assert client.get(f"/api/crm/customers/{ids['a']}/amc", headers=ha).status_code == 200
    assert client.get(f"/api/crm/customers/{ids['a']}/payments", headers=ha).status_code == 200
    assert client.get(f"/api/crm/tasks?customer_id={ids['a']}", headers=ha).status_code == 200
    # Enumeration scoped to own records only
    res = client.get("/api/customers", headers=ha)
    assert res.status_code == 200
    assert {c["id"] for c in res.json()} == {ids["a"]}
    res = client.get(f"/api/customers/search?q={EMAIL_A}", headers=ha)
    assert res.status_code == 200
    assert all(c["id"] == ids["a"] for c in res.json())
    # Owner may update own demographics (released profile flow)
    res = client.put(f"/api/customers/{ids['a']}", json={"city": "Lucknow"}, headers=ha)
    assert res.status_code == 200


def test_admin_access(two_customers):
    ids = two_customers
    assert client.get(f"/api/crm/customers/{ids['a']}/360", headers=ADMIN_HEADERS).status_code == 200
    assert client.get("/api/crm/pipeline-metrics", headers=ADMIN_HEADERS).status_code == 200
    assert client.get("/api/crm/audit-log", headers=ADMIN_HEADERS).status_code == 200
    res = client.get("/api/customers", headers=ADMIN_HEADERS)
    assert res.status_code == 200
    assert {ids["a"], ids["b"]} <= {c["id"] for c in res.json()}
    assert client.get("/api/dashboard/analytics", headers=ADMIN_HEADERS).status_code == 200


def test_non_admin_denied_admin_routes(two_customers):
    ha = headers(EMAIL_A)
    assert client.get("/api/crm/pipeline-metrics", headers=ha).status_code == 403
    assert client.get("/api/crm/audit-log", headers=ha).status_code == 403
    assert client.get("/api/crm/reports/crm", headers=ha).status_code == 403
    assert client.get("/api/dashboard/analytics", headers=ha).status_code == 403
    assert client.post("/api/customers", json={
        "consumer_number": "CRM-X", "customer_name": "X",
        "discom": "DVVNL", "city": "Lucknow",
    }, headers=ha).status_code == 403


def test_owner_timeline_loads_success(two_customers):
    ids = two_customers
    res = client.get(f"/api/crm/timeline/{ids['a']}", headers=headers(EMAIL_A))
    assert res.status_code == 200
    body = res.json()
    assert body.get("success") is True
    assert isinstance(body.get("data"), list)


def test_empty_timeline_is_valid_success(monkeypatch):
    monkeypatch.setattr(crm_routes, "has_admin_access", lambda email: email == EMAIL_ADMIN)
    monkeypatch.setattr(customer_routes, "has_admin_access", lambda email: email == EMAIL_ADMIN)
    db = SessionLocal()
    cust = CustomerModel(
        consumer_number=f"CRM-EMPTY-{uuid.uuid4().hex[:8]}", customer_name="Empty Owner",
        discom="DVVNL", city="Lucknow", email="crm.empty@getsolar.in",
    )
    db.add(cust)
    db.commit()
    db.refresh(cust)
    cid = cust.id
    try:
        # Remove any orphaned timeline rows for this id (id reuse in dev DBs)
        # so the test proves a genuinely empty timeline is valid success.
        from crm_models import CRMActivityTimelineModel
        db.query(CRMActivityTimelineModel).filter(
            CRMActivityTimelineModel.customer_id == cid
        ).delete()
        db.commit()
        res = client.get(
            f"/api/crm/timeline/{cid}",
            headers=headers("crm.empty@getsolar.in"),
        )
        assert res.status_code == 200
        body = res.json()
        assert body.get("success") is True
        assert body.get("data") == []
    finally:
        from crm_models import CRMActivityTimelineModel
        db.query(CRMActivityTimelineModel).filter(
            CRMActivityTimelineModel.customer_id == cid
        ).delete()
        db.query(CustomerModel).filter(CustomerModel.id == cid).delete()
        db.commit()
        db.close()


def test_cross_customer_timeline_denied(two_customers):
    ids = two_customers
    res = client.get(f"/api/crm/timeline/{ids['a']}", headers=headers(EMAIL_B))
    assert res.status_code == 404


def test_admin_timeline_loads(two_customers):
    ids = two_customers
    res = client.get(f"/api/crm/timeline/{ids['a']}", headers=ADMIN_HEADERS)
    assert res.status_code == 200
    assert res.json().get("success") is True
