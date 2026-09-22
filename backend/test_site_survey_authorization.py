"""Site Survey IDOR + AI honesty regression tests.

Self-cleaning: all sqlite rows created here are deleted in teardown.
"""
import pytest
from fastapi.testclient import TestClient

from main import app
from security import create_access_token
from database_sqlite import SessionLocalSqlite as SessionLocal
from site_survey_models import SiteSurveyModel
import site_survey as site_survey_module

client = TestClient(app, raise_server_exceptions=False)

EMAIL_VENDOR = "survey.vendor@getsolar.in"
EMAIL_OTHER = "survey.other@getsolar.in"
EMAIL_ADMIN = "survey.admin@getsolar.in"


def headers(email):
    token = create_access_token({"sub": email, "email": email, "role": "vendor"})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def owned_survey(monkeypatch):
    monkeypatch.setattr(
        site_survey_module, "has_admin_access", lambda email: email == EMAIL_ADMIN
    )
    db = SessionLocal()
    survey = SiteSurveyModel(
        customer_name="Survey Owner", city="Lucknow",
        assigned_to=EMAIL_VENDOR, status="scheduled",
    )
    db.add(survey)
    db.commit()
    db.refresh(survey)
    sid = survey.id
    yield sid
    db.query(SiteSurveyModel).filter(SiteSurveyModel.id == sid).delete()
    db.commit()
    db.close()


def test_unauthenticated_denied(owned_survey):
    sid = owned_survey
    assert client.get(f"/api/site-surveys/{sid}").status_code == 401
    assert client.put(f"/api/site-surveys/{sid}", json={"city": "Agra"}).status_code == 401
    assert client.delete(f"/api/site-surveys/{sid}").status_code == 401
    assert client.get("/api/site-surveys").status_code == 401


def test_owner_access(owned_survey):
    sid = owned_survey
    h = headers(EMAIL_VENDOR)
    assert client.get(f"/api/site-surveys/{sid}", headers=h).status_code == 200
    res = client.put(f"/api/site-surveys/{sid}", json={"city": "Agra"}, headers=h)
    assert res.status_code == 200
    res = client.get(f"/api/site-surveys/{sid}/proposal-prefill", headers=h)
    assert res.status_code == 200


def test_cross_user_denied(owned_survey):
    sid = owned_survey
    h = headers(EMAIL_OTHER)
    assert client.get(f"/api/site-surveys/{sid}", headers=h).status_code == 404
    assert client.put(f"/api/site-surveys/{sid}", json={"city": "Agra"}, headers=h).status_code == 404
    assert client.patch(f"/api/site-surveys/{sid}/status", json={"status": "approved"}, headers=h).status_code == 404
    assert client.delete(f"/api/site-surveys/{sid}", headers=h).status_code == 404
    assert client.get(f"/api/site-surveys/{sid}/proposal-prefill", headers=h).status_code == 404
    assert client.get(f"/api/site-surveys/{sid}/photos", headers=h).status_code == 404
    assert client.put(f"/api/site-surveys/{sid}/checklist", json={"checklist": []}, headers=h).status_code == 404


def test_admin_access(owned_survey):
    sid = owned_survey
    h = headers(EMAIL_ADMIN)
    assert client.get(f"/api/site-surveys/{sid}", headers=h).status_code == 200
    assert client.patch(f"/api/site-surveys/{sid}/assign", json={
        "assigned_to": EMAIL_VENDOR, "assigned_name": "Vendor",
    }, headers=h).status_code == 200


def test_assign_admin_only(owned_survey):
    sid = owned_survey
    res = client.patch(f"/api/site-surveys/{sid}/assign", json={
        "assigned_to": EMAIL_OTHER, "assigned_name": "Other",
    }, headers=headers(EMAIL_VENDOR))
    assert res.status_code == 404


def test_list_scoped_to_assignee(owned_survey):
    res = client.get("/api/site-surveys", headers=headers(EMAIL_VENDOR))
    assert res.status_code == 200
    assert all(s["assigned_to"] == EMAIL_VENDOR for s in res.json()["data"])
    res = client.get(f"/api/site-surveys?assigned_to={EMAIL_VENDOR}", headers=headers(EMAIL_OTHER))
    assert res.status_code == 200
    assert res.json()["data"] == []
