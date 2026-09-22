"""Customer search contract tests (GET /api/customers/search).

Covers: matching by consumer_number/name/email (case-insensitive),
auth gating, scope filtering, unknown queries, and allowed fields.
Self-cleaning: all sqlite rows created here are deleted in teardown.
"""
import uuid

import pytest
from fastapi.testclient import TestClient

from main import app
from security import create_access_token
from database_sqlite import SessionLocalSqlite as SessionLocal, CustomerModel
import customer_routes

client = TestClient(app, raise_server_exceptions=False)

EMAIL_ADMIN = "search.admin@getsolar.in"
EMAIL_A = "search.owner.a@getsolar.in"
EMAIL_B = "search.owner.b@getsolar.in"


def headers(email, role="customer"):
    token = create_access_token({"sub": email, "email": email, "role": role})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def search_rows(monkeypatch):
    monkeypatch.setattr(
        customer_routes, "has_admin_access",
        lambda email: email == EMAIL_ADMIN,
    )
    db = SessionLocal()
    suffix = uuid.uuid4().hex[:8]
    row_a = CustomerModel(
        consumer_number=f"SEARCH-{suffix}A", customer_name="Searchable Anita",
        discom="DVVNL", city="Lucknow", email=EMAIL_A,
    )
    row_b = CustomerModel(
        consumer_number=f"SEARCH-{suffix}B", customer_name="Searchable Babu",
        discom="DVVNL", city="Agra", email=EMAIL_B,
    )
    db.add_all([row_a, row_b])
    db.commit()
    db.refresh(row_a)
    db.refresh(row_b)
    ids = {"a": row_a.id, "b": row_b.id, "suffix": suffix}
    yield ids
    db.query(CustomerModel).filter(CustomerModel.id.in_([ids["a"], ids["b"]])).delete()
    db.commit()
    db.close()


def test_admin_search_by_consumer_number(search_rows):
    ids = search_rows
    res = client.get(
        f"/api/customers/search?q=SEARCH-{ids['suffix']}A",
        headers=headers(EMAIL_ADMIN, "admin"),
    )
    assert res.status_code == 200
    assert [c["id"] for c in res.json()] == [ids["a"]]


def test_admin_search_by_name(search_rows):
    res = client.get("/api/customers/search?q=anita", headers=headers(EMAIL_ADMIN, "admin"))
    assert res.status_code == 200
    assert len(res.json()) == 1
    assert res.json()[0]["customer_name"] == "Searchable Anita"


def test_admin_search_by_email(search_rows):
    res = client.get(f"/api/customers/search?q={EMAIL_A}", headers=headers(EMAIL_ADMIN, "admin"))
    assert res.status_code == 200
    assert len(res.json()) == 1
    assert res.json()[0]["email"] == EMAIL_A


def test_search_case_insensitive(search_rows):
    res = client.get("/api/customers/search?q=ANITA", headers=headers(EMAIL_ADMIN, "admin"))
    assert res.status_code == 200
    assert len(res.json()) == 1
    res = client.get(f"/api/customers/search?q={EMAIL_B.upper()}", headers=headers(EMAIL_ADMIN, "admin"))
    assert res.status_code == 200
    assert len(res.json()) == 1


def test_search_requires_auth(search_rows):
    assert client.get("/api/customers/search?q=anita").status_code == 401


def test_customer_search_scoped_to_own_records(search_rows):
    ids = search_rows
    res = client.get("/api/customers/search?q=Searchable", headers=headers(EMAIL_B))
    assert res.status_code == 200
    assert [c["id"] for c in res.json()] == [ids["b"]]


def test_search_results_carry_identifying_fields(search_rows):
    res = client.get("/api/customers/search?q=anita", headers=headers(EMAIL_ADMIN, "admin"))
    assert res.status_code == 200
    item = res.json()[0]
    assert item["id"]
    assert item["consumer_number"].startswith("SEARCH-")
    assert item["customer_name"] == "Searchable Anita"
    assert item["email"] == EMAIL_A


def test_unknown_search_returns_empty(search_rows):
    res = client.get("/api/customers/search?q=no-such-customer-zzz", headers=headers(EMAIL_ADMIN, "admin"))
    assert res.status_code == 200
    assert res.json() == []


def test_email_indexed_customer_returned_by_email(monkeypatch):
    """Fixture row with a demo-style email is returned when searched by email.

    Proves the email-search contract without touching real records.
    """
    monkeypatch.setattr(
        customer_routes, "has_admin_access",
        lambda email: email == EMAIL_ADMIN,
    )
    db = SessionLocal()
    suffix = uuid.uuid4().hex[:8]
    row = CustomerModel(
        consumer_number=f"DEMO-{suffix}", customer_name="Demo User",
        discom="DVVNL", city="Lucknow", email=f"demo.search.{suffix}@getsolar.in",
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    cid = row.id
    try:
        res = client.get(
            f"/api/customers/search?q=demo.search.{suffix}@getsolar.in",
            headers=headers(EMAIL_ADMIN, "admin"),
        )
        assert res.status_code == 200
        assert [c["id"] for c in res.json()] == [cid]
    finally:
        db.query(CustomerModel).filter(CustomerModel.id == cid).delete()
        db.commit()
        db.close()
