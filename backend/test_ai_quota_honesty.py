"""AI quota/provider-failure honesty regression tests.

Quota exhaustion must return honest failure (429/503, success:false) —
never fabricated success:true demo data.
"""
import pytest
from fastapi.testclient import TestClient

from main import app
from security import create_access_token
from ai.provider_factory import set_ai_provider
from ai.provider_base import BaseAIProvider

client = TestClient(app, raise_server_exceptions=False)

EMAIL = "ai.quota@getsolar.in"


def headers():
    token = create_access_token({"sub": EMAIL, "email": EMAIL, "role": "customer"})
    return {"Authorization": f"Bearer {token}"}


class QuotaExhaustedProvider(BaseAIProvider):
    def generate_response(self, request):
        raise RuntimeError("429 Resource exhausted: quota exceeded")

    def get_model_name(self):
        return "quota-exhausted-test"


@pytest.fixture()
def quota_exhausted(monkeypatch):
    import ai.provider_factory as factory
    monkeypatch.setattr(factory, "_current_provider", QuotaExhaustedProvider())
    yield
    monkeypatch.setattr(factory, "_current_provider", None)


def _assert_honest(res):
    assert res.status_code in (429, 503)
    body = res.json()
    assert body.get("success") is not True
    assert body.get("fallback") is not True
    assert "data" not in body or body.get("data") is None


def test_amc_quota_failure_honest(quota_exhausted):
    res = client.post("/api/amc-recommendation", json={
        "customer_name": "Quota User", "city": "Lucknow", "system_size_kw": 5,
        "installation_date": "2023-01-01", "last_service_date": "2024-01-01",
        "current_generation_units": 400, "expected_generation_units": 500,
        "inverter_error_codes": "None", "panel_cleaning_done": True,
        "physical_damage_observed": False, "damage_details": "None",
    }, headers=headers())
    _assert_honest(res)


def test_site_survey_quota_failure_honest(quota_exhausted):
    res = client.post("/api/site-survey", json={
        "customer_name": "Quota User", "city": "Lucknow", "roof_type": "Flat",
        "roof_age_years": 5, "total_roof_area_sqft": 1000, "shading_present": False,
        "shading_details": "None", "obstacles": "None",
        "electrical_panel_distance_m": 10, "structure_condition": "Good",
        "proposed_system_kw": 5,
    }, headers=headers())
    _assert_honest(res)


def test_roof_quota_failure_honest(quota_exhausted):
    res = client.post(
        "/api/analyze-roof",
        files={"image": ("roof.png", b"\x89PNG\r\n\x1a\n" + b"0" * 100, "image/png")},
        data={"length_ft": 20, "width_ft": 30, "city": "Lucknow", "source": "camera"},
        headers=headers(),
    )
    _assert_honest(res)
