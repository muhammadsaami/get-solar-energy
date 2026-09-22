"""Support ticket email delivery tests (POST /api/support/tickets)."""
import os

import pytest
from fastapi.testclient import TestClient

os.environ.setdefault("SUPPORT_EMAIL", "Getsolarenergy14@gmail.com")

from main import app  # noqa: E402
from security import create_access_token  # noqa: E402
import support as support_module  # noqa: E402

client = TestClient(app, raise_server_exceptions=False)

CUSTOMER = "support.customer@getsolar.in"


def auth_headers(email= CUSTOMER):
    token = create_access_token({"sub": email, "email": email, "role": "customer"})
    return {"Authorization": f"Bearer {token}"}


def mock_send_ok(monkeypatch, captured):
    async def fake_send(msg, **kwargs):
        captured["msg"] = msg
        captured["kwargs"] = kwargs
        return {}
    monkeypatch.setattr(support_module.aiosmtplib, "send", fake_send)


def mock_send_fail(monkeypatch):
    async def fake_send(msg, **kwargs):
        raise RuntimeError("SMTP connection refused")
    monkeypatch.setattr(support_module.aiosmtplib, "send", fake_send)


def valid_payload(**overrides):
    body = {"subject": "Inverter Error Code F24", "message": "My inverter shows F24 since yesterday.", "name": "Test Customer"}
    body.update(overrides)
    return body


def test_unauthenticated_submission_rejected():
    res = client.post("/api/support/tickets", json=valid_payload())
    assert res.status_code == 401


def test_empty_message_rejected():
    res = client.post("/api/support/tickets", json=valid_payload(message="   "), headers=auth_headers("t2@getsolar.in"))
    assert res.status_code == 422


def test_empty_subject_rejected():
    res = client.post("/api/support/tickets", json=valid_payload(subject="  "), headers=auth_headers("t3@getsolar.in"))
    assert res.status_code == 422


def test_oversized_message_rejected():
    res = client.post("/api/support/tickets", json=valid_payload(message="x" * 4001), headers=auth_headers("t4@getsolar.in"))
    assert res.status_code == 422


def test_recipient_is_fixed_support_inbox(monkeypatch):
    monkeypatch.setenv("SUPPORT_EMAIL", "Getsolarenergy14@gmail.com")
    captured = {}
    mock_send_ok(monkeypatch, captured)
    # Even with an extra attacker-controlled field, the recipient must not change.
    res = client.post(
        "/api/support/tickets",
        json={**valid_payload(), "to": "evil@example.com", "recipient": "evil@example.com"},
        headers=auth_headers("t5@getsolar.in"),
    )
    assert res.status_code == 200
    assert res.json()["success"] is True
    assert captured["msg"]["To"] == "Getsolarenergy14@gmail.com"


def test_successful_send_includes_customer_info(monkeypatch):
    captured = {}
    mock_send_ok(monkeypatch, captured)
    res = client.post("/api/support/tickets", json=valid_payload(), headers=auth_headers("t6@getsolar.in"))
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert body["ticket_id"]
    msg = captured["msg"]
    assert msg["Reply-To"] == "t6@getsolar.in"
    assert "F24" in msg["Subject"]
    payload = msg.get_payload()[0].get_payload()
    assert "t6@getsolar.in" in payload
    assert "My inverter shows F24 since yesterday." in payload


def test_email_failure_returns_failure(monkeypatch):
    mock_send_fail(monkeypatch)
    res = client.post("/api/support/tickets", json=valid_payload(), headers=auth_headers("t7@getsolar.in"))
    assert res.status_code == 502
    assert res.json().get("success") is not True
    assert "Unable to send" in res.json().get("detail", "")
