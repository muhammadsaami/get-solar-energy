"""Generic proposal endpoint is admin-only (POST /api/generate-proposal).

Proposal generation is an admin-only capability. The shared generation core
in proposal.py stays intact for admin flows; only the HTTP surface is gated.
Self-cleaning: no DB rows created; AI provider is mocked.
"""
from fastapi.testclient import TestClient

from main import app
from security import create_access_token

client = TestClient(app, raise_server_exceptions=False)


def headers(email, role="customer"):
    token = create_access_token({"sub": email, "email": email, "role": role})
    return {"Authorization": f"Bearer {token}"}


def valid_payload():
    return {
        "customer_name": "Test Customer",
        "customer_address": "1 Solar Street",
        "city": "Lucknow",
        "monthly_units": 400,
        "monthly_bill_rs": 3200,
        "per_unit_rate": 8.0,
        "recommended_kw": 3,
        "roof_area_sqft": 400,
        "vendor_name": "Get Solar Energy",
    }


def test_generate_proposal_unauth_denied():
    res = client.post("/api/generate-proposal", json=valid_payload())
    assert res.status_code == 401


def test_generate_proposal_non_admin_denied(monkeypatch):
    import permissions as permissions_module

    # Only the admin identity passes, regardless of self-claimed JWT role.
    monkeypatch.setattr(
        permissions_module, "USERS_FILE", "definitely-missing-users.json"
    )
    for email, role in [
        ("proposal.cust@getsolar.in", "customer"),
        ("proposal.vendor@getsolar.in", "vendor"),
        ("proposal.tech@getsolar.in", "technician"),
        ("proposal.eng@getsolar.in", "engineer"),
    ]:
        res = client.post(
            "/api/generate-proposal", json=valid_payload(), headers=headers(email, role)
        )
        assert res.status_code == 403


def test_generate_proposal_admin_allowed(monkeypatch):
    import ai.provider_factory as factory
    import proposal as proposal_module

    class FakeProvider:
        def generate_response(self, request):
            class Resp:
                content = (
                    '{"customer_name": "Test Customer", "vendor_name": "Get Solar Energy", '
                    '"system_cost_rs": 150000, "net_cost_rs": 150000, '
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
    monkeypatch.setattr(
        proposal_module, "has_admin_access", lambda email: email == "proposal.admin@getsolar.in"
    )
    try:
        res = client.post(
            "/api/generate-proposal",
            json=valid_payload(),
            headers=headers("proposal.admin@getsolar.in", "admin"),
        )
        assert res.status_code == 200
        assert res.json().get("success") is True
    finally:
        monkeypatch.setattr(factory, "_current_provider", None)
